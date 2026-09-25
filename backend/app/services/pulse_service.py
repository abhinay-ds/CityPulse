from __future__ import annotations

from datetime import timedelta
from app.utils.clock import utc_now

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.cctv import CctvCamera, CctvEvent
from app.models.emergency import EmergencyReport
from app.models.incident import Incident
from app.services.weather_service import fetch_weather


def _clamp(value: float, low: float = 0, high: float = 100) -> int:
    return int(max(low, min(high, round(value))))


def compute_pulse(db: Session, latitude: float, longitude: float) -> dict:
    incidents = db.query(Incident).filter(Incident.status != "RESOLVED").all()
    emergencies = db.query(EmergencyReport).filter(EmergencyReport.status != "resolved").all()
    cameras = db.query(CctvCamera).all()
    events = db.query(CctvEvent).all()
    alerts = db.query(Alert).filter(Alert.status == "active").all()
    weather = fetch_weather(latitude, longitude)

    safety_penalty = 0
    for item in incidents:
        if item.severity == "critical":
            safety_penalty += 18
        elif item.severity == "high":
            safety_penalty += 12
        elif item.severity == "medium":
            safety_penalty += 6
        else:
            safety_penalty += 3
    safety_penalty += min(20, len(emergencies) * 8)
    safety = _clamp(100 - safety_penalty)

    traffic_penalty = 0
    for item in incidents:
        if item.category in {"Major Road Accident", "Road Blockage"}:
            traffic_penalty += 14
    traffic_penalty += sum(8 for ev in events if "traffic" in (ev.event_type or "").lower() or "collision" in (ev.event_type or "").lower())
    traffic = _clamp(100 - traffic_penalty)

    env_penalty = 0
    if (weather.get("precipitation") or 0) > 2 or (weather.get("conditionCode") or 0) >= 60:
        env_penalty += 18
    elif (weather.get("precipitation") or 0) > 0:
        env_penalty += 8
    env_penalty += sum(10 for item in incidents if item.category in {"Heavy Rain", "Flood", "Cyclone"})
    environment = _clamp(100 - env_penalty)

    infra_penalty = 0
    infra_penalty += sum(10 for item in incidents if item.category == "Infrastructure Damage")
    offline = [cam for cam in cameras if cam.status == "offline"]
    infra_penalty += len(offline) * 6
    infrastructure = _clamp(100 - infra_penalty)

    emergency_activity = _clamp(100 - min(70, len(emergencies) * 12 + len([a for a in alerts if a.priority in {"high", "critical"}]) * 6))

    overall = _clamp(
        safety * 0.28 + traffic * 0.22 + environment * 0.22 + infrastructure * 0.18 + emergency_activity * 0.10
    )

    recent = utc_now() - timedelta(hours=2)
    older_start = utc_now() - timedelta(hours=8)
    recent_count = len([i for i in incidents if i.created_at and i.created_at >= recent])
    older_count = len(
        [i for i in incidents if i.created_at and older_start <= i.created_at < recent]
    )
    trend = "stable"
    if recent_count > older_count + 1:
        trend = "worsening"
    elif older_count > recent_count + 1:
        trend = "improving"

    disruption = _clamp(100 - overall)
    if disruption >= 76:
        state = "CRITICAL"
        summary = "Critical Incident State"
        desc = "Multiple severe events detected. Follow official safety guidance."
    elif disruption >= 51:
        state = "HIGH"
        summary = "High Advisory State"
        desc = "Substantial civic disruption or severe hazards active in your zone."
    elif disruption >= 26:
        state = "ELEVATED"
        summary = "Elevated Precaution"
        desc = "Weather or traffic events require attention in your locality."
    else:
        state = "NORMAL"
        summary = "Normal"
        desc = "No verified emergency in your immediate sector"

    explanation = (
        f"Pulse health is {overall}/100 from safety ({safety}), traffic ({traffic}), "
        f"environment ({environment}), infrastructure ({infrastructure}) and emergency activity "
        f"({emergency_activity}). Score is deterministic from current database signals, not random."
    )

    contributing = []
    if incidents:
        contributing.append(f"{len(incidents)} unresolved incidents (safety {safety}/100)")
    if emergencies:
        contributing.append(f"{len(emergencies)} open emergency reports")
    if env_penalty:
        contributing.append("Weather precipitation/flood risk reduced environment score")
    if traffic_penalty:
        contributing.append("Accident/blockage or congestion-class CCTV events reduced traffic score")
    if offline:
        contributing.append(f"{len(offline)} offline CCTV cameras reduced infrastructure score")
    if not contributing:
        contributing.append("No major penalties; civic signals are within normal bounds")

    return {
        "overallScore": overall,
        "score": overall,
        "riskLevel": state,
        "location": {"latitude": latitude, "longitude": longitude},
        "timestamp": utc_now().isoformat(),
        "contributingFactors": contributing,
        "components": {
            "safety": safety,
            "traffic": traffic,
            "environment": environment,
            "infrastructure": infrastructure,
            "emergencyActivity": emergency_activity,
        },
        "trend": trend,
        "updatedAt": utc_now().isoformat(),
        "explanation": explanation,
        "methodology": (
            "Each component starts at 100 and subtracts penalties from unresolved incidents, "
            "emergencies, weather precipitation, CCTV congestion events, and offline cameras. "
            "overallScore is a weighted mean. Frontend disruption score is 100 - overallScore "
            "to preserve the existing CityPulse UI (higher displayed score = more disruption)."
        ),
        "isSimulated": False,
        "frontend": {
            "score": disruption,
            "state": state,
            "statusSummary": summary,
            "statusDescription": desc,
            "breakdown": {
                "weatherRisk": min(25, _clamp(100 - environment) // 4),
                "trafficCongestion": min(25, _clamp(100 - traffic) // 4),
                "incidentDensity": min(25, _clamp(100 - safety) // 4),
                "infrastructureAnomalies": min(25, _clamp(100 - infrastructure) // 4),
            },
            "contributingFactors": contributing,
            "explanation": explanation,
        },
    }
