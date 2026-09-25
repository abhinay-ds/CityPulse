import type {
  CctvCameraItem,
  CctvEventType,
  CivicNewsItem,
  CityPulseScoreData,
  EmergencyReportRecord,
  GeoCoordinates,
  IncidentReport,
  LocalAlertItem,
  ReportLifecycleStatus,
  TrafficSnapshot,
} from '../types/civic';
import { calculateDistanceKm } from './locationService';
import { apiRequest } from './apiClient';

function withDistance<T extends { coords?: GeoCoordinates; latitude?: number; longitude?: number }>(
  origin: GeoCoordinates,
  item: T,
  coords?: GeoCoordinates
): number {
  const point = coords || item.coords;
  if (!point) {
    if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
      return calculateDistanceKm(origin, { lat: item.latitude, lng: item.longitude });
    }
    return 0;
  }
  return calculateDistanceKm(origin, point);
}

export async function fetchIncidents(origin: GeoCoordinates): Promise<IncidentReport[]> {
  const items = await apiRequest<IncidentReport[]>(
    `/api/incidents?latitude=${origin.lat}&longitude=${origin.lng}`
  );
  return items.map((item) => ({
    ...item,
    distanceKm: item.distanceKm ?? withDistance(origin, item, item.coords),
  }));
}

export async function createIncident(payload: Record<string, unknown>): Promise<IncidentReport> {
  return apiRequest<IncidentReport>('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function patchIncidentStatus(
  id: string,
  status: ReportLifecycleStatus
): Promise<IncidentReport> {
  return apiRequest<IncidentReport>(`/api/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchAlerts(origin: GeoCoordinates): Promise<LocalAlertItem[]> {
  const items = await apiRequest<Array<Record<string, unknown>>>(
    `/api/alerts?latitude=${origin.lat}&longitude=${origin.lng}`
  );
  return items.map((item) => {
    const apiCategory = String(item.category || 'Other');
    const category: LocalAlertItem['category'] =
      apiCategory === 'Weather' ? 'Weather' : apiCategory === 'Traffic' ? 'Traffic' : 'Severe';
    const priority = String(item.priority || 'medium');
    const priorityLabel: LocalAlertItem['priorityLabel'] =
      priority === 'critical'
        ? 'CRITICAL'
        : priority === 'high'
          ? 'HIGH PRIORITY'
          : priority === 'low'
            ? 'NORMAL'
            : 'ADVISORY';
    const rawStatus = String(item.status || 'active');
    const status: LocalAlertItem['status'] =
      rawStatus === 'active'
        ? priority === 'high' || priority === 'critical'
          ? 'VERIFIED'
          : 'MONITORING'
        : 'REPORTED';
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const distanceKm = hasCoords
      ? calculateDistanceKm(origin, { lat, lng })
      : Number(item.distanceKm || 0);
    return {
      id: String(item.id),
      title: String(item.title),
      description: String(item.description || item.message || ''),
      category,
      priorityLabel,
      status,
      area: String(item.area || item.locationName || 'Local area'),
      distanceKm,
      timestamp: String(item.timestamp || 'Recently'),
      source: String(item.source || 'CityPulse Civic Grid'),
      iconType: (item.iconType as LocalAlertItem['iconType']) || 'hazard',
      coords: hasCoords ? { lat, lng } : undefined,
      isSimulated: Boolean(item.isSimulated ?? true),
    };
  });
}

export async function createAlert(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiRequest('/api/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function mapCameraStatus(status: unknown): CctvCameraItem['status'] {
  if (status === 'offline' || status === 'demo' || status === 'connecting' || status === 'online') {
    return status;
  }
  return 'offline';
}

export async function fetchCctvFleet(): Promise<CctvCameraItem[]> {
  const items = await apiRequest<Array<Record<string, unknown>>>('/api/cctv/cameras');
  return items.map((item) => ({
    id: String(item.id || item.camera_id),
    cameraCode: String(item.cameraCode || item.camera_id),
    name: String(item.name),
    area: String(item.area || item.location_name || 'Local area'),
    mandal: String(item.mandal || 'Local Mandal'),
    coords: (item.coords as GeoCoordinates) || {
      lat: Number(item.latitude),
      lng: Number(item.longitude),
    },
    status: mapCameraStatus(item.status),
    streamType: (item.stream_type as CctvCameraItem['streamType']) || 'demo',
    streamUrl: (item.stream_url as string | null) ?? null,
    lastError: (item.last_error as string | null) ?? null,
    isEnabled: Boolean(item.is_enabled ?? true),
    streamFps: Number(item.streamFps || 0),
    resolution: String(item.resolution || '1080p'),
    lastPing: String(item.lastPing || 'Unknown'),
    latestEvent: item.latestEvent as CctvCameraItem['latestEvent'],
    isSimulated: Boolean(item.isSimulated ?? item.stream_type === 'demo'),
  }));
}

export async function fetchCctvEvents(): Promise<
  Array<{
    id: string;
    cameraId: string;
    type: CctvEventType | string;
    severity: string;
    confidence: number;
    timestamp: string;
    description: string;
    location?: string;
    isSimulated: boolean;
  }>
> {
  const items = await apiRequest<Array<Record<string, unknown>>>('/api/cctv/events');
  return items.map((item) => ({
    id: String(item.id || item.event_id),
    cameraId: String(item.camera_id),
    type: String(item.event_type),
    severity: String(item.frontendSeverity || item.severity || 'ELEVATED'),
    confidence: Number(item.confidence || 0),
    timestamp: String(item.timestamp || 'Recently'),
    description: String(item.description || 'Simulated privacy-preserving spatial event.'),
    isSimulated: Boolean(item.isSimulated ?? true),
  }));
}

export async function fetchNews(): Promise<CivicNewsItem[]> {
  const items = await apiRequest<Array<Record<string, unknown>>>('/api/news');
  return items.map((item) => ({
    id: String(item.id || item.news_id),
    title: String(item.title),
    summary: String(item.summary),
    source: String(item.source),
    scope: (item.scope || item.geographic_level || 'Area') as CivicNewsItem['scope'],
    locationTag: String(item.locationTag || item.location_name || ''),
    timestamp: String(item.timestamp || 'Recently'),
    priority: (item.priority as CivicNewsItem['priority']) || 'routine',
    verified: Boolean(item.verified),
    isDemo: Boolean(item.isDemo ?? true),
  }));
}

export async function fetchPulseScore(origin: GeoCoordinates): Promise<CityPulseScoreData> {
  const body = await apiRequest<{
    frontend: Omit<CityPulseScoreData, 'aiInsight'> & {
      contributingFactors?: string[];
      explanation?: string;
    };
    explanation?: string;
    contributingFactors?: string[];
  }>(`/api/pulse?latitude=${origin.lat}&longitude=${origin.lng}`);
  const insights = await apiRequest<{
    plainLanguageSummary: string;
    anomalyMetric: string;
    possibleCorrelation: string;
    epistemicDisclaimer: string;
    insights?: CityPulseScoreData['aiInsight']['insights'];
    source?: string;
  }>(`/api/insights?latitude=${origin.lat}&longitude=${origin.lng}`);
  return {
    ...body.frontend,
    contributingFactors: body.frontend.contributingFactors || body.contributingFactors,
    explanation: body.frontend.explanation || body.explanation,
    aiInsight: {
      plainLanguageSummary: insights.plainLanguageSummary,
      anomalyMetric: insights.anomalyMetric,
      possibleCorrelation: insights.possibleCorrelation,
      epistemicDisclaimer: insights.epistemicDisclaimer,
      insights: insights.insights,
      source: insights.source,
    },
  };
}

export async function fetchTraffic(origin: GeoCoordinates): Promise<TrafficSnapshot> {
  return apiRequest<TrafficSnapshot>(`/api/traffic?latitude=${origin.lat}&longitude=${origin.lng}`);
}

export async function fetchEmergencies(): Promise<EmergencyReportRecord[]> {
  const items = await apiRequest<Array<Record<string, unknown>>>('/api/emergency');
  return items.map((item) => ({
    id: String(item.id || item.report_id),
    reportId: String(item.report_id || item.id),
    category: String(item.category),
    description: String(item.description || ''),
    severity: String(item.severity || 'medium'),
    status: String(item.status || 'reported'),
    coords: {
      lat: Number(item.latitude),
      lng: Number(item.longitude),
    },
    locationName: String(item.location_name || 'Reported location'),
    isSimulated: Boolean(item.isSimulated ?? true),
    createdAt: String(item.created_at || ''),
  }));
}

export async function createEmergencyReport(payload: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>('/api/emergency', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function patchEmergencyStatus(id: string, status: string) {
  return apiRequest(`/api/emergency/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function createCctvCamera(payload: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>('/api/cctv/cameras', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function connectCctvCamera(cameraId: string) {
  return apiRequest<Record<string, unknown>>(`/api/cctv/cameras/${cameraId}/connect`, {
    method: 'POST',
  });
}

export async function disconnectCctvCamera(cameraId: string) {
  return apiRequest<Record<string, unknown>>(`/api/cctv/cameras/${cameraId}/disconnect`, {
    method: 'POST',
  });
}
