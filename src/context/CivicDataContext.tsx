import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  CctvCameraItem,
  CctvEventType,
  CivicNewsItem,
  CityPulseScoreData,
  EmergencyReportRecord,
  IncidentCategory,
  IncidentReport,
  LocalAlertItem,
  ReportLifecycleStatus,
  TrafficSnapshot,
  WeatherConditionData,
} from '../types/civic';
import { useLocation } from './LocationContext';
import { generateInitialCivicData, computePulseScore } from '../services/civicDataService';
import { fetchLiveWeatherData, getFallbackWeatherData } from '../services/weatherService';
import {
  createAlert,
  createEmergencyReport,
  createIncident,
  fetchAlerts,
  fetchCctvEvents,
  fetchCctvFleet,
  fetchEmergencies,
  fetchIncidents,
  fetchNews,
  fetchPulseScore,
  fetchTraffic,
  patchIncidentStatus,
} from '../services/civicApi';
import { getApiBaseUrl } from '../services/apiClient';

const USER_REPORT_IDS_KEY = 'citypulse-user-report-ids';

function readStoredReportIds(): string[] {
  try {
    const raw = sessionStorage.getItem(USER_REPORT_IDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function storeReportId(id: string) {
  const next = Array.from(new Set([...readStoredReportIds(), id]));
  sessionStorage.setItem(USER_REPORT_IDS_KEY, JSON.stringify(next));
}

function alertCategoryForIncident(category: IncidentCategory): string {
  if (category === 'Heavy Rain' || category === 'Flood' || category === 'Cyclone') return 'Weather';
  if (category === 'Major Road Accident' || category === 'Road Blockage') return 'Traffic';
  if (category === 'Infrastructure Damage') return 'Infrastructure';
  return 'Emergency';
}

function iconForIncident(category: IncidentCategory): LocalAlertItem['iconType'] {
  if (category === 'Fire / Smoke') return 'fire';
  if (category === 'Flood' || category === 'Heavy Rain') return 'flood';
  if (category === 'Major Road Accident' || category === 'Road Blockage') return 'traffic';
  return 'hazard';
}

interface CivicDataContextType {
  incidents: IncidentReport[];
  cctvFleet: CctvCameraItem[];
  alerts: LocalAlertItem[];
  news: CivicNewsItem[];
  weather: WeatherConditionData | null;
  pulseScore: CityPulseScoreData;
  traffic: TrafficSnapshot | null;
  emergencies: EmergencyReportRecord[];
  isLoading: boolean;
  civicError: string | null;
  isLoadingWeather: boolean;
  weatherError: string | null;
  isOffline: boolean;
  usingBackend: boolean;
  lastRefreshed: Date;
  submitIncidentReport: (
    data: Pick<IncidentReport, 'category' | 'description' | 'coords' | 'evidenceMediaUrl'>
  ) => Promise<IncidentReport>;
  updateIncidentStatus: (id: string, newStatus: ReportLifecycleStatus) => Promise<void>;
  refreshData: () => Promise<void>;
  userReports: IncidentReport[];
}

const CivicDataContext = createContext<CivicDataContextType | undefined>(undefined);

export const CivicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { location, calculateDistanceTo } = useLocation();

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [cctvFleet, setCctvFleet] = useState<CctvCameraItem[]>([]);
  const [alerts, setAlerts] = useState<LocalAlertItem[]>([]);
  const [news, setNews] = useState<CivicNewsItem[]>([]);
  const [pulseScore, setPulseScore] = useState<CityPulseScoreData>(() => computePulseScore([], []));
  const [traffic, setTraffic] = useState<TrafficSnapshot | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencyReportRecord[]>([]);
  const [weather, setWeather] = useState<WeatherConditionData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [civicError, setCivicError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [usingBackend, setUsingBackend] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [userReports, setUserReports] = useState<IncidentReport[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCivicData = useCallback(async () => {
    const fallback = generateInitialCivicData(location);
    let backendOk = false;
    setIsLoading(true);
    setCivicError(null);

    const origin = location.coords;
    const [incRes, alertRes, camRes, newsRes, pulseRes, trafficRes, emgRes, eventRes] =
      await Promise.allSettled([
        fetchIncidents(origin),
        fetchAlerts(origin),
        fetchCctvFleet(),
        fetchNews(),
        fetchPulseScore(origin),
        fetchTraffic(origin),
        fetchEmergencies(),
        fetchCctvEvents(),
      ]);

    if (incRes.status === 'fulfilled') {
      setIncidents(incRes.value);
      backendOk = true;
      const remembered = new Set(readStoredReportIds());
      setUserReports(incRes.value.filter((item) => remembered.has(item.id)));
    } else {
      setIncidents(fallback.incidents);
      setUserReports([]);
    }

    if (alertRes.status === 'fulfilled') {
      setAlerts(alertRes.value);
      backendOk = true;
    } else {
      setAlerts(fallback.alerts);
    }

    if (camRes.status === 'fulfilled') {
      let cameras = camRes.value;
      if (eventRes.status === 'fulfilled') {
        cameras = cameras.map((cam) => {
          if (cam.latestEvent) return cam;
          const match = eventRes.value.find((ev) => ev.cameraId === cam.id);
          if (!match) return cam;
          const severity: NonNullable<CctvCameraItem['latestEvent']>['severity'] =
            match.severity === 'CRITICAL' || match.severity === 'critical'
              ? 'CRITICAL'
              : match.severity === 'HIGH' || match.severity === 'high'
                ? 'HIGH'
                : match.severity === 'NORMAL' || match.severity === 'normal' || match.severity === 'low'
                  ? 'NORMAL'
                  : 'ELEVATED';
          return {
            ...cam,
            latestEvent: {
              type: match.type as CctvEventType,
              severity,
              confidence: match.confidence,
              timestamp: match.timestamp,
              description: match.description,
            },
          };
        });
      }
      setCctvFleet(cameras);
      backendOk = true;
    } else {
      setCctvFleet(fallback.cctvFleet);
    }

    if (newsRes.status === 'fulfilled') {
      setNews(newsRes.value);
      backendOk = true;
    } else {
      setNews(fallback.news);
    }

    if (pulseRes.status === 'fulfilled') {
      setPulseScore(pulseRes.value);
    } else {
      const liveIncidents = incRes.status === 'fulfilled' ? incRes.value : fallback.incidents;
      const liveCams = camRes.status === 'fulfilled' ? camRes.value : fallback.cctvFleet;
      setPulseScore(computePulseScore(liveIncidents, liveCams));
    }

    if (trafficRes.status === 'fulfilled') {
      setTraffic(trafficRes.value);
    } else {
      setTraffic(null);
    }

    if (emgRes.status === 'fulfilled') {
      setEmergencies(emgRes.value);
    } else {
      setEmergencies([]);
    }

    setUsingBackend(backendOk);
    if (!backendOk) {
      setCivicError('CityPulse API is unreachable. Showing local demo civic data.');
    }
    setLastRefreshed(new Date());
    setIsLoading(false);

    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const weatherData = await fetchLiveWeatherData(location.coords.lat, location.coords.lng);
      setWeather(weatherData);
    } catch {
      setWeather(getFallbackWeatherData());
      setWeatherError('Live meteorological service unreachable. Showing cached civic readings.');
    } finally {
      setIsLoadingWeather(false);
    }
  }, [location]);

  useEffect(() => {
    loadCivicData();
  }, [loadCivicData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadCivicData();
      }
    }, 45000);
    return () => window.clearInterval(timer);
  }, [loadCivicData]);

  useEffect(() => {
    const source = new EventSource(`${getApiBaseUrl()}/api/stream`);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type && payload.type !== 'hello' && payload.type !== 'ping') {
          void loadCivicData();
        }
      } catch {
        // Ignore malformed stream frames; interval refresh remains the fallback.
      }
    };
    source.onerror = () => {
      source.close();
    };
    return () => source.close();
  }, [loadCivicData]);

  const submitIncidentReport = useCallback(
    async (data: Pick<IncidentReport, 'category' | 'description' | 'coords' | 'evidenceMediaUrl'>) => {
      const distance = calculateDistanceTo(data.coords);
      const severity: IncidentReport['severity'] =
        data.category === 'Fire / Smoke' ||
        data.category === 'Gas Leak' ||
        data.category === 'Major Road Accident'
          ? 'high'
          : 'medium';

      try {
        const created = await createIncident({
          category: data.category,
          description: data.description,
          latitude: data.coords.lat,
          longitude: data.coords.lng,
          area: location.area,
          mandal: location.mandal,
          district: location.district,
          locationName: location.area,
          evidenceMediaUrl: data.evidenceMediaUrl,
          sourceType: 'citizen',
          severity,
        });

        let emergencyReportId: string | undefined;
        try {
          const emergency = await createEmergencyReport({
            category: data.category,
            description: data.description,
            severity,
            latitude: data.coords.lat,
            longitude: data.coords.lng,
            location_name: location.area,
            evidence_url: data.evidenceMediaUrl,
          });
          emergencyReportId = String(emergency.report_id || emergency.id || '');
        } catch {
          // Emergency persistence is best-effort alongside the incident record.
        }

        try {
          await createAlert({
            title: `${data.category} reported`,
            message: data.description || 'Resident incident submitted for verification.',
            category: alertCategoryForIncident(data.category),
            priority: severity === 'high' ? 'high' : 'medium',
            latitude: data.coords.lat,
            longitude: data.coords.lng,
            area: location.area,
            district: location.district,
            locationName: location.area,
            source: 'Citizen Safety Report',
            iconType: iconForIncident(data.category),
          });
        } catch {
          // Alert fan-out is optional if the incident itself persisted.
        }

        storeReportId(created.id);
        setUsingBackend(true);
        await loadCivicData();
        return { ...created, emergencyReportId };
      } catch {
        const newReport: IncidentReport = {
          id: `rep-${Date.now()}`,
          category: data.category,
          title: `${data.category} in ${location.area}`,
          description: data.description,
          locationName: location.area,
          hierarchy: {
            area: location.area,
            mandal: location.mandal,
            district: location.district,
          },
          coords: data.coords,
          distanceKm: distance,
          timestamp: 'Just now',
          reportedAtIso: new Date().toISOString(),
          severity,
          confidencePercent: 75,
          status: 'REPORTED',
          evidenceMediaUrl: data.evidenceMediaUrl,
          possibleImpact: 'Civic personnel assessing locality perimeter.',
          whatToDo: 'Avoid approaching the immediate zone. Keep access roads clear for civic units.',
          sourceType: 'citizen',
          authorityRouting: {
            department:
              data.category === 'Fire / Smoke' || data.category === 'Gas Leak'
                ? 'Central Fire & Disaster Management'
                : data.category === 'Major Road Accident' || data.category === 'Road Blockage'
                  ? 'Traffic Safety Division'
                  : 'Municipal Rapid Response',
            routingStatus: 'prepared',
            assignedUnit: 'Simulated Duty Officer #104',
            etaMinutes: 10,
            isSimulated: true,
            actionGuidance:
              'Routing prepared / simulated for civic emergency services. This platform coordinates signals; in a life-threatening emergency, call 112 directly.',
          },
        };

        setIncidents((prev) => [newReport, ...prev]);
        setUserReports((prev) => [newReport, ...prev]);
        setUsingBackend(false);

        const newAlert: LocalAlertItem = {
          id: `alt-${Date.now()}`,
          title: `${data.category} reported`,
          description: data.description || 'Resident incident submitted for verification.',
          category:
            data.category === 'Heavy Rain' || data.category === 'Flood'
              ? 'Weather'
              : data.category === 'Major Road Accident' || data.category === 'Road Blockage'
                ? 'Traffic'
                : 'Severe',
          priorityLabel: 'HIGH PRIORITY',
          status: 'REPORTED',
          area: location.area,
          distanceKm: distance,
          timestamp: 'Just now',
          source: 'Citizen Safety Report',
          iconType: iconForIncident(data.category),
          coords: data.coords,
        };
        setAlerts((prev) => [newAlert, ...prev]);
        return newReport;
      }
    },
    [location, calculateDistanceTo, loadCivicData]
  );

  const updateIncidentStatus = useCallback(
  async (id: string, newStatus: ReportLifecycleStatus): Promise<void> => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, status: newStatus } : inc
      )
    );

    setUserReports((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, status: newStatus } : inc
      )
    );

    try {
      await patchIncidentStatus(id, newStatus);
    } catch {
      // Keep the optimistic UI update if the backend update fails.
    }
  },
  []
);

  return (
    <CivicDataContext.Provider
      value={{
        incidents,
        cctvFleet,
        alerts,
        news,
        weather,
        pulseScore,
        traffic,
        emergencies,
        isLoading,
        civicError,
        isLoadingWeather,
        weatherError,
        isOffline,
        usingBackend,
        lastRefreshed,
        submitIncidentReport,
        updateIncidentStatus,
        refreshData: loadCivicData,
        userReports,
      }}
    >
      {children}
    </CivicDataContext.Provider>
  );
};

export function useCivicData() {
  const context = useContext(CivicDataContext);
  if (!context) {
    throw new Error('useCivicData must be used within a CivicDataProvider');
  }
  return context;
}
