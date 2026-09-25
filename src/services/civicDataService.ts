import type {
  CctvCameraItem,
  CivicHierarchyLocation,
  CivicNewsItem,
  CityPulseScoreData,
  IncidentReport,
  LocalAlertItem,
} from '../types/civic';
import { calculateDistanceKm } from './locationService';

/**
 * Local demo civic dataset used ONLY when the CityPulse API is unreachable.
 * Live screens must load incidents/alerts/CCTV/news/pulse from the backend first.
 */
export function generateInitialCivicData(loc: CivicHierarchyLocation) {
  const { coords, area, mandal, district } = loc;

  // Generate dynamic incident locations around the user's actual coordinate
  const userLat = coords.lat;
  const userLng = coords.lng;

  // 1. Incidents
  const incidents: IncidentReport[] = [
    {
      id: 'inc-101',
      category: 'Heavy Rain',
      title: 'Water accumulation & localized rain',
      description: 'Localized precipitation causing surface water buildup along underpass approach road.',
      locationName: `${area} Main Corridor`,
      hierarchy: { area, mandal, district },
      coords: { lat: userLat + 0.0035, lng: userLng + 0.0028 },
      distanceKm: 0.6,
      timestamp: 'Just now',
      reportedAtIso: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      severity: 'medium',
      confidencePercent: 94,
      status: 'REPORTED',
      possibleImpact: 'Traffic slow-down; two-wheelers advised to take elevated flyover.',
      whatToDo: 'Exercise caution, avoid low-clearance vehicles under the railway underpass.',
      sourceType: 'citizen',
      authorityRouting: {
        department: 'Municipal Drainage & Stormwater Cell',
        routingStatus: 'prepared',
        assignedUnit: 'Ward Pump Unit 4',
        etaMinutes: 15,
        isSimulated: true,
        actionGuidance: 'High-capacity dewatering pump scheduled for dispatch if water level exceeds 15cm.',
      },
    },
    {
      id: 'inc-102',
      category: 'Major Road Accident',
      title: 'Commercial vehicle breakdown & collision',
      description: 'Collision between two light utility vehicles causing single lane blockage and tailback.',
      locationName: `Main Junction · ${area}`,
      hierarchy: { area, mandal, district },
      coords: { lat: userLat - 0.0082, lng: userLng + 0.0064 },
      distanceKm: 1.2,
      timestamp: '12 min ago',
      reportedAtIso: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      severity: 'high',
      confidencePercent: 98,
      status: 'REPORTED',
      possibleImpact: 'Lane 1 & 2 constrained; 25-minute transit delay on arterial route.',
      whatToDo: 'Divert via Ring Road; emergency responders en route.',
      sourceType: 'cctv_ai',
      authorityRouting: {
        department: 'Traffic Police & Quick Recovery Team',
        routingStatus: 'dispatched',
        assignedUnit: 'Traffic Patrol 12 & Tow Unit',
        etaMinutes: 8,
        isSimulated: true,
        actionGuidance: 'Routing prepared. Sector recovery crane dispatched to clear primary carriage-way.',
      },
    },
    {
      id: 'inc-103',
      category: 'Road Blockage',
      title: 'Fallen tree branch on avenue',
      description: 'Large bough severed by localized wind gust, obstructing pedestrian pathway and cycle track.',
      locationName: `Park Avenue · ${area}`,
      hierarchy: { area, mandal, district },
      coords: { lat: userLat + 0.011, lng: userLng - 0.0075 },
      distanceKm: 1.7,
      timestamp: '24 min ago',
      reportedAtIso: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      severity: 'low',
      confidencePercent: 88,
      status: 'UNDER REVIEW',
      possibleImpact: 'Pedestrian bypass restricted to eastern footpath.',
      whatToDo: 'Pass on the marked eastern perimeter walkway; tree-trimming team notified.',
      sourceType: 'citizen',
      authorityRouting: {
        department: 'Civic Horticulture & Works Division',
        routingStatus: 'prepared',
        assignedUnit: 'Tree Response Crew B',
        etaMinutes: 30,
        isSimulated: true,
        actionGuidance: 'Crew alerted to clear debris and inspect adjacent trees for structural integrity.',
      },
    },
    {
      id: 'inc-104',
      category: 'Fire / Smoke',
      title: 'Dry waste fire contained',
      description: 'Controlled waste containment near commercial bin yard, reported by resident.',
      locationName: `Industrial Sector 3 · ${mandal}`,
      hierarchy: { area: 'Sector 3', mandal, district },
      coords: { lat: userLat + 0.022, lng: userLng + 0.018 },
      distanceKm: 3.4,
      timestamp: '45 min ago',
      reportedAtIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      severity: 'medium',
      confidencePercent: 96,
      status: 'VERIFIED',
      possibleImpact: 'Localized smoke plume drifting northwest away from residential cluster.',
      whatToDo: 'Windows kept closed in 500m radius; fire tenders have damped residual embers.',
      sourceType: 'cctv_ai',
      authorityRouting: {
        department: 'Municipal Fire & Emergency Services',
        routingStatus: 'acknowledged',
        assignedUnit: 'Fire Tender 03',
        etaMinutes: 0,
        isSimulated: true,
        actionGuidance: 'Emergency unit verified fire extinguished; cooling operations underway.',
      },
    },
  ];

  // Recalculate exact distance from user coords
  incidents.forEach((inc) => {
    inc.distanceKm = calculateDistanceKm(coords, inc.coords);
  });

  // 2. CCTV fleet
  const cctvFleet: CctvCameraItem[] = [
    {
      id: 'cam-01',
      cameraCode: 'CP-CAM-401',
      name: 'Main Junction North Pole',
      area,
      mandal,
      coords: { lat: userLat - 0.008, lng: userLng + 0.006 },
      status: 'online',
      streamFps: 25,
      resolution: '1080p · Optical 30x',
      lastPing: '3s ago',
      latestEvent: {
        type: 'vehicle collision',
        severity: 'HIGH',
        confidence: 94,
        timestamp: '12 min ago',
        description: 'Multi-vehicle velocity mismatch detected at signal junction.',
      },
    },
    {
      id: 'cam-02',
      cameraCode: 'CP-CAM-402',
      name: 'Underpass Transit Portal',
      area,
      mandal,
      coords: { lat: userLat + 0.003, lng: userLng + 0.003 },
      status: 'online',
      streamFps: 24,
      resolution: '1080p · Thermal Overlay',
      lastPing: '1s ago',
      latestEvent: {
        type: 'flooding/water accumulation',
        severity: 'ELEVATED',
        confidence: 89,
        timestamp: '6 min ago',
        description: 'Road surface reflection and curb water level threshold +8cm.',
      },
    },
    {
      id: 'cam-03',
      cameraCode: 'CP-CAM-403',
      name: 'East Sector Market Promenade',
      area,
      mandal,
      coords: { lat: userLat + 0.009, lng: userLng + 0.012 },
      status: 'offline',
      streamFps: 0,
      resolution: '1080p',
      lastPing: '18m ago (Network Timeout)',
      latestEvent: undefined,
    },
  ];

  // 3. Alerts matching cp1.jpeg
  const alerts: LocalAlertItem[] = [
    {
      id: 'alt-01',
      title: 'Heavy rain advisory',
      description: 'Heavy rainfall expected across your locality. Water accumulation possible in underpasses.',
      category: 'Weather',
      priorityLabel: 'HIGH PRIORITY',
      status: 'VERIFIED',
      area: 'Your locality',
      distanceKm: 0.6,
      timestamp: '8 min ago',
      source: 'Civic Meteorological Grid',
      iconType: 'weather',
    },
    {
      id: 'alt-02',
      title: 'Major road accident',
      description: 'Commercial carrier collision causing severe traffic bottleneck at Main Junction.',
      category: 'Traffic',
      priorityLabel: 'HIGH PRIORITY',
      status: 'REPORTED',
      area: `Main Road Junction · ${area}`,
      distanceKm: 1.2,
      timestamp: '12 min ago',
      source: 'CCTV Vision & Citizen Reports',
      iconType: 'traffic',
    },
    {
      id: 'alt-03',
      title: 'Drainage clearing underway',
      description: 'Municipal engineering team deployed for suction pump operations at storm drains.',
      category: 'Severe',
      priorityLabel: 'ADVISORY',
      status: 'VERIFIED',
      area: area,
      distanceKm: 1.8,
      timestamp: '25 min ago',
      source: 'Ward Engineering Control',
      iconType: 'hazard',
    },
  ];

  // 4. Civic News
  const news: CivicNewsItem[] = [
    {
      id: 'news-01',
      title: `${area}: Pre-monsoon stormwater culvert maintenance completed`,
      summary: 'Municipal corporation teams have concluded sediment extraction across all arterial road culverts.',
      source: 'Civic Information Bureau',
      scope: 'Area',
      locationTag: area,
      timestamp: '1 hour ago',
      priority: 'important',
      verified: true,
    },
    {
      id: 'news-02',
      title: `${mandal}: Scheduled traffic detour during flyover structural inspection`,
      summary: 'Night-time inspection scheduled between 23:00 and 05:00. Heavy transport vehicles rerouted to outer ring bypass.',
      source: 'Traffic Police Commissionerate',
      scope: 'Mandal',
      locationTag: mandal,
      timestamp: '3 hours ago',
      priority: 'routine',
      verified: true,
    },
    {
      id: 'news-03',
      title: `${district}: Integrated Emergency Command Center inaugurates automated signal response`,
      summary: 'Sensors across 120 key intersections now feed continuous telemetry directly into the municipal emergency dispatch.',
      source: 'Smart City Mission Authority',
      scope: 'District',
      locationTag: district,
      timestamp: '5 hours ago',
      priority: 'routine',
      verified: true,
    },
    {
      id: 'news-04',
      title: 'Transit Alert: Feeder bus frequency increased on metro corridors',
      summary: 'To alleviate rainy-day road congestion, feeder buses will operate at 8-minute headways during peak hours.',
      source: 'Public Transport Undertaking',
      scope: 'Nearby',
      locationTag: 'Metro Line 1 Corridor',
      timestamp: '6 hours ago',
      priority: 'routine',
      verified: true,
    },
  ];

  // 5. CityPulse Score (0-100)
  const pulseScore: CityPulseScoreData = computePulseScore(incidents, cctvFleet);

  return { incidents, cctvFleet, alerts, news, pulseScore };
}

export function computePulseScore(
  incidents: IncidentReport[],
  cctvFleet: CctvCameraItem[]
): CityPulseScoreData {
  // Score formula:
  // Baseline: 12
  // Active high/critical incidents: +15 each
  // Active medium incidents: +8 each
  // Weather alerts: +10
  // Offline cameras / CCTV anomalies: +5
  let score = 16;

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  activeIncidents.forEach((i) => {
    if (i.severity === 'critical') score += 25;
    else if (i.severity === 'high') score += 15;
    else if (i.severity === 'medium') score += 8;
    else score += 4;
  });

  const offlineCams = cctvFleet.filter((c) => c.status === 'offline').length;
  score += offlineCams * 4;

  score = Math.min(100, Math.max(0, score));

  let state: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'NORMAL';
  let summary = 'Normal';
  let desc = 'No verified emergency in your immediate sector';

  if (score >= 76) {
    state = 'CRITICAL';
    summary = 'Critical Incident State';
    desc = 'Multiple severe events detected. Follow official safety guidance.';
  } else if (score >= 51) {
    state = 'HIGH';
    summary = 'High Advisory State';
    desc = 'Substantial civic disruption or severe hazards active in your zone.';
  } else if (score >= 26) {
    state = 'ELEVATED';
    summary = 'Elevated Precaution';
    desc = 'Weather or traffic events require attention in your locality.';
  }

  return {
    score,
    state,
    statusSummary: summary,
    statusDescription: desc,
    breakdown: {
      weatherRisk: Math.min(25, Math.round(score * 0.3)),
      trafficCongestion: Math.min(25, Math.round(score * 0.35)),
      incidentDensity: Math.min(25, Math.round(score * 0.25)),
      infrastructureAnomalies: Math.min(25, Math.round(score * 0.1)),
    },
    aiInsight: {
      plainLanguageSummary:
        'Heavy rainfall is currently affecting your locality. Traffic speed near Main Road Junction is lower than the recent baseline.',
      anomalyMetric: 'Complaint volume is 3.4x baseline near Junction Corridor.',
      possibleCorrelation: 'Possible relationship: Rainfall ↔ reduced traffic speed',
      epistemicDisclaimer: 'Possible correlation, not confirmed causation.',
    },
  };
}
