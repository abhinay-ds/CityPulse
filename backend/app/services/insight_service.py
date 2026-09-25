from __future__ import annotations

import logging
from datetime import timedelta
from app.utils.clock import utc_now

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.alert import Alert
from app.models.cctv import CctvEvent
from app.models.emergency import EmergencyReport
from app.models.incident import Incident
from app.services.weather_service import fetch_weather

logger = logging.getLogger("citypulse.insights")


def _area_name(incident: Incident) -> str:
    return incident.area or incident.location_name or "Local area"


def detect_anomalies(db: Session) -> list[dict]:
    now = utc_now()
    recent_window = now - timedelta(hours=2)
    baseline_window = now - timedelta(hours=8)

    recent_incidents = db.query(Incident).filter(Incident.created_at >= recent_window).count()
    baseline_incidents = (
        db.query(Incident)
        .filter(Incident.created_at >= baseline_window, Incident.created_at < recent_window)
        .count()
    )
    recent_emergencies = db.query(EmergencyReport).filter(EmergencyReport.created_at >= recent_window).count()
    recent_events = db.query(CctvEvent).filter(CctvEvent.created_at >= recent_window).count()

    anomalies = []
    if recent_incidents >= max(3, baseline_incidents * 2) and recent_incidents > 0:
        anomalies.append(
            {
                "type": "incident_surge",
                "metric": f"Incident volume is {recent_incidents} in 2h vs {baseline_incidents} in the prior 6h.",
                "confidence": 0.72,
            }
        )
    if recent_emergencies >= 2:
        anomalies.append(
            {
                "type": "emergency_cluster",
                "metric": f"{recent_emergencies} emergency reports in the last 2 hours.",
                "confidence": 0.7,
            }
        )
    if recent_events >= 3:
        anomalies.append(
            {
                "type": "cctv_event_cluster",
                "metric": f"{recent_events} privacy-preserving CCTV events in the last 2 hours.",
                "confidence": 0.64,
            }
        )
    return anomalies


def detect_correlations(db: Session, weather: dict) -> list[dict]:
    incidents = db.query(Incident).filter(Incident.status != "RESOLVED").all()
    events = db.query(CctvEvent).all()
    correlations = []

    rainish = (weather.get("precipitation") or 0) > 1 or (weather.get("conditionCode") or 0) >= 51
    water = [
        i
        for i in incidents
        if i.category in {"Flood", "Heavy Rain"}
    ] + [e for e in events if "flood" in (e.event_type or "").lower() or "water" in (e.event_type or "").lower()]
    if rainish and water:
        correlations.append(
            {
                "signals": ["Heavy Rain", "Waterlogging"],
                "relationship": "Possible rainfall-related flooding",
                "confidence": 0.68,
                "affected_area": _area_name(incidents[0]) if incidents else "Local area",
                "explanation": "Precipitation plus waterlogging/flood reports are occurring together.",
            }
        )

    accidents = [i for i in incidents if i.category in {"Major Road Accident", "Road Blockage"}]
    congestion = [e for e in events if "traffic" in (e.event_type or "").lower() or "collision" in (e.event_type or "").lower()]
    if accidents and congestion:
        correlations.append(
            {
                "signals": ["Road Accident", "Traffic Congestion"],
                "relationship": "Possible accident-related traffic disruption",
                "confidence": 0.74,
                "affected_area": accidents[0].location_name,
                "explanation": "An active accident/blockage coincides with congestion-class CCTV events.",
            }
        )

    infra_areas: dict[str, int] = {}
    for item in incidents:
        if item.category == "Infrastructure Damage":
            infra_areas[item.area] = infra_areas.get(item.area, 0) + 1
    for area, count in infra_areas.items():
        if count >= 2:
            correlations.append(
                {
                    "signals": ["Repeated Infrastructure Complaints", "Same Area"],
                    "relationship": "Infrastructure hotspot",
                    "confidence": 0.7,
                    "affected_area": area,
                    "explanation": f"{count} unresolved infrastructure reports in {area}.",
                }
            )

    open_emergencies = db.query(EmergencyReport).filter(EmergencyReport.status != "resolved").count()
    if open_emergencies >= 2 and len(incidents) >= 2:
        correlations.append(
            {
                "signals": ["Emergencies", "Incidents"],
                "relationship": "Simultaneous emergencies",
                "confidence": 0.6,
                "affected_area": incidents[0].area if incidents else "Local area",
                "explanation": "Multiple open emergencies overlap with active incident reports.",
            }
        )

    return correlations


def _optional_llm_rewrite(summary: str) -> tuple[str, bool]:
    """Use an OpenAI-compatible endpoint when configured. Always fall back to rules."""
    if not settings.llm_api_key or not settings.llm_api_url:
        return summary, False
    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.post(
                settings.llm_api_url,
                headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "Rewrite this civic briefing in one short paragraph. Do not invent facts.",
                        },
                        {"role": "user", "content": summary},
                    ],
                },
            )
        if response.status_code >= 400:
            return summary, False
        content = (
            response.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content")
        )
        if content:
            return str(content).strip(), True
    except Exception as exc:
        logger.warning("Optional LLM insight skipped: %s", exc)
    return summary, False


def build_insights(db: Session, latitude: float, longitude: float) -> dict:
    weather = fetch_weather(latitude, longitude)
    anomalies = detect_anomalies(db)
    correlations = detect_correlations(db, weather)
    incidents = db.query(Incident).filter(Incident.status != "RESOLVED").all()
    alerts = db.query(Alert).filter(Alert.status == "active").all()

    if incidents:
        top = max(incidents, key=lambda i: {"critical": 4, "high": 3, "medium": 2, "low": 1, "normal": 0}.get(i.severity, 0))
        summary = (
            f"{len(incidents)} active civic incidents near {top.area}. "
            f"Highest-severity item: {top.category} ({top.severity})."
        )
    else:
        summary = "No unresolved incidents in the current civic dataset."

    if weather.get("precipitation", 0) > 1:
        summary += " Rain signals are present in the latest weather reading."

    summary, llm_used = _optional_llm_rewrite(summary)

    anomaly_metric = anomalies[0]["metric"] if anomalies else "No statistical surge detected against the recent baseline."
    correlation_text = (
        correlations[0]["relationship"] if correlations else "No strong multi-signal relationship identified."
    )

    insights = []
    for item in anomalies:
        insights.append(
            {
                "title": item["type"].replace("_", " ").title(),
                "severity": "high" if item["confidence"] >= 0.7 else "medium",
                "evidence": [item["metric"]],
                "explanation": item["metric"],
                "recommendedAction": "Increase monitoring density and verify the newest citizen reports before dispatch.",
            }
        )
    for item in correlations:
        insights.append(
            {
                "title": item["relationship"],
                "severity": "high" if item["confidence"] >= 0.7 else "medium",
                "evidence": item.get("signals") or [],
                "explanation": item.get("explanation") or item["relationship"],
                "recommendedAction": f"Review overlapping signals in {item.get('affected_area', 'the local area')} and keep access roads clear.",
            }
        )
    if not insights:
        insights.append(
            {
                "title": "No multi-signal anomaly",
                "severity": "low",
                "evidence": [f"{len(incidents)} unresolved incidents", f"{len(alerts)} active alerts"],
                "explanation": summary,
                "recommendedAction": "Continue routine monitoring. Use 112 for life-threatening emergencies.",
            }
        )

    return {
        "generatedAt": utc_now().isoformat(),
        "source": "llm" if llm_used else "rule-based",
        "llmEnabled": llm_used,
        "plainLanguageSummary": summary,
        "anomalyMetric": anomaly_metric,
        "possibleCorrelation": correlation_text,
        "epistemicDisclaimer": "Possible correlation, not confirmed causation. Insights are rule-based unless an optional LLM rewrite is configured.",
        "anomalies": anomalies,
        "correlations": correlations,
        "insights": insights,
        "activeIncidents": len(incidents),
        "activeAlerts": len(alerts),
        "isSimulated": False,
    }
