export type SeverityLevel = 'normal' | 'low' | 'medium' | 'high' | 'critical';

export type IncidentCategory =
  | 'Fire / Smoke'
  | 'Flood'
  | 'Heavy Rain'
  | 'Earthquake'
  | 'Cyclone'
  | 'Landslide'
  | 'Gas Leak'
  | 'Major Road Accident'
  | 'Road Blockage'
  | 'Infrastructure Damage'
  | 'Other Emergency';

export type ReportLifecycleStatus =
  | 'REPORT RECEIVED'
  | 'REPORTED'
  | 'UNDER REVIEW'
  | 'VERIFIED'
  | 'RESPONSE INITIATED'
  | 'RESOLVED';

export type AlertFilterCategory = 'All' | 'Severe' | 'Weather' | 'Traffic';

export type NewsHierarchyScope = 'Area' | 'Mandal' | 'District' | 'Nearby';

export type UserRole = 'resident' | 'staff' | 'responder' | 'admin';

export type CctvEventType =
  | 'vehicle collision'
  | 'fire/smoke'
  | 'traffic congestion'
  | 'road blockage'
  | 'crowd buildup'
  | 'flooding/water accumulation'
  | 'fallen object'
  | 'abandoned object'
  | 'unusual vehicle stoppage'
  | 'infrastructure damage'
  | 'restricted-area intrusion'
  | 'traffic-signal malfunction';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface CivicHierarchyLocation {
  area: string;
  mandal: string;
  district: string;
  state: string;
  formattedAddress: string;
  coords: GeoCoordinates;
  isCustom?: boolean;
}

export interface AuthorityRoutingInfo {
  department: string;
  routingStatus: 'prepared' | 'dispatched' | 'simulated' | 'acknowledged';
  assignedUnit?: string;
  etaMinutes?: number;
  isSimulated: boolean;
  actionGuidance: string;
}

export interface IncidentReport {
  id: string;
  category: IncidentCategory;
  title: string;
  description: string;
  locationName: string;
  hierarchy: {
    area: string;
    mandal: string;
    district: string;
  };
  coords: GeoCoordinates;
  distanceKm?: number;
  timestamp: string;
  reportedAtIso: string;
  severity: SeverityLevel;
  confidencePercent: number;
  status: ReportLifecycleStatus;
  evidenceMediaUrl?: string;
  authorityRouting: AuthorityRoutingInfo;
  possibleImpact: string;
  whatToDo: string;
  verifiedBy?: string;
  sourceType: 'citizen' | 'cctv_ai' | 'sensor_weather' | 'traffic_sensor' | 'municipal_feed';
  emergencyReportId?: string;
}

export interface LocalAlertItem {
  id: string;
  title: string;
  description: string;
  category: AlertFilterCategory;
  priorityLabel: 'HIGH PRIORITY' | 'CRITICAL' | 'ADVISORY' | 'NORMAL';
  status: 'VERIFIED' | 'REPORTED' | 'MONITORING';
  area: string;
  distanceKm: number;
  timestamp: string;
  source: string;
  iconType: 'weather' | 'traffic' | 'fire' | 'flood' | 'hazard';
  coords?: GeoCoordinates;
  isSimulated?: boolean;
}

export interface CctvCameraItem {
  id: string;
  cameraCode: string;
  name: string;
  area: string;
  mandal: string;
  coords: GeoCoordinates;
  status: 'online' | 'offline' | 'demo' | 'connecting';
  streamType?: 'demo' | 'rtsp' | 'http';
  streamUrl?: string | null;
  lastError?: string | null;
  isEnabled?: boolean;
  streamFps?: number;
  resolution?: string;
  lastPing: string;
  latestEvent?: {
    type: CctvEventType;
    severity: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
    confidence: number;
    timestamp: string;
    description: string;
  };
  isSimulated?: boolean;
}

export interface CivicNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  scope: NewsHierarchyScope;
  locationTag: string;
  timestamp: string;
  priority: 'routine' | 'important' | 'breaking';
  verified: boolean;
  linkUrl?: string;
  isDemo?: boolean;
}

export interface WeatherConditionData {
  temperatureC: number;
  feelsLikeC: number;
  conditionText: string;
  conditionCode: number;
  humidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number;
  uvIndex: number;
  isFallback?: boolean;
  civicAdvisory: {
    title: string;
    impactText: string;
    duration: string;
    severity: SeverityLevel;
  };
  hourlyForecast: Array<{
    time: string;
    temp: number;
    pop: number; // Probability of precipitation %
    condition: string;
  }>;
  dailyForecast: Array<{
    day: string;
    minTemp: number;
    maxTemp: number;
    condition: string;
    rainfallProb: number;
  }>;
}

export interface CivicInsightCard {
  title: string;
  severity: string;
  evidence: string[];
  explanation: string;
  recommendedAction: string;
}

export interface CityPulseScoreData {
  score: number; // 0 to 100
  state: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  statusSummary: string;
  statusDescription: string;
  breakdown: {
    weatherRisk: number; // 0-25
    trafficCongestion: number; // 0-25
    incidentDensity: number; // 0-25
    infrastructureAnomalies: number; // 0-25
  };
  contributingFactors?: string[];
  explanation?: string;
  aiInsight: {
    plainLanguageSummary: string;
    anomalyMetric: string;
    possibleCorrelation: string;
    epistemicDisclaimer: string;
    insights?: CivicInsightCard[];
    source?: string;
  };
}

export interface TrafficSegment {
  road: string;
  latitude: number;
  longitude: number;
  congestion: number;
  congestionLevel: string;
  estimated_delay: number;
  related_incident: string | null;
  isSimulated: boolean;
}

export interface TrafficSnapshot {
  isSimulated: boolean;
  provider: string;
  updatedAt: string;
  note?: string;
  segments: TrafficSegment[];
}

export interface EmergencyReportRecord {
  id: string;
  reportId: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  coords: GeoCoordinates;
  locationName: string;
  isSimulated: boolean;
  createdAt: string;
}

