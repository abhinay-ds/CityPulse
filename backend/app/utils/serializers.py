from __future__ import annotations

from app.utils.clock import utc_now

from app.models.alert import Alert
from app.models.cctv import CctvCamera, CctvEvent
from app.models.emergency import EmergencyReport
from app.models.incident import Incident
from app.models.news import CivicNews
from app.utils.geo import haversine_km
from app.utils.routing import simulated_authority_routing
from app.utils.timefmt import clock_time, relative_time


FRONTEND_EVENT_SEVERITY = {
    "normal": "NORMAL",
    "low": "NORMAL",
    "medium": "ELEVATED",
    "high": "HIGH",
    "critical": "CRITICAL",
}


def serialize_incident(incident: Incident, origin: tuple[float, float] | None = None) -> dict:
    created = incident.created_at or utc_now()
    distance = None
    if origin:
        distance = haversine_km(origin[0], origin[1], incident.latitude, incident.longitude)
    routing = incident.authority_routing or simulated_authority_routing(incident.category)
    return {
        "id": incident.incident_id,
        "category": incident.category,
        "title": incident.title,
        "description": incident.description,
        "locationName": incident.location_name,
        "hierarchy": {
            "area": incident.area,
            "mandal": incident.mandal,
            "district": incident.district,
        },
        "coords": {"lat": incident.latitude, "lng": incident.longitude},
        "distanceKm": distance,
        "timestamp": clock_time(created),
        "reportedAtIso": created.isoformat(),
        "severity": incident.severity,
        "confidencePercent": incident.confidence_percent or 0,
        "status": incident.status,
        "evidenceMediaUrl": incident.evidence_media_url,
        "authorityRouting": routing,
        "possibleImpact": incident.possible_impact or "",
        "whatToDo": incident.what_to_do or "",
        "verifiedBy": incident.verified_by,
        "sourceType": incident.source_type or "citizen",
    }


def serialize_alert(alert: Alert, origin: tuple[float, float] | None = None) -> dict:
    created = alert.created_at or utc_now()
    distance = None
    if origin and alert.latitude is not None and alert.longitude is not None:
        distance = haversine_km(origin[0], origin[1], alert.latitude, alert.longitude)
    return {
        "id": alert.alert_id,
        "title": alert.title,
        "message": alert.message,
        "description": alert.message,
        "category": alert.category,
        "priority": alert.priority,
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "locationName": alert.location_name,
        "area": alert.area or alert.location_name,
        "district": alert.district,
        "status": alert.status,
        "createdAt": created,
        "timestamp": relative_time(created),
        "source": alert.source or "CityPulse Civic Grid",
        "iconType": alert.icon_type or "hazard",
        "distanceKm": distance if distance is not None else 0,
        "isSimulated": True,
    }


def serialize_event(event: CctvEvent) -> dict:
    created = event.created_at or utc_now()
    return {
        "id": event.event_id,
        "event_id": event.event_id,
        "camera_id": event.camera_id,
        "event_type": event.event_type,
        "severity": event.severity,
        "confidence": event.confidence,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "description": event.description,
        "created_at": created.isoformat(),
        "timestamp": relative_time(created),
        "isSimulated": bool(event.is_simulated if event.is_simulated is not None else 1),
        "frontendSeverity": FRONTEND_EVENT_SEVERITY.get((event.severity or "medium").lower(), "ELEVATED"),
    }


def serialize_camera(camera: CctvCamera, latest: CctvEvent | None = None) -> dict:
    from app.services.cctv_service import redact_stream_url

    last_seen = camera.last_seen
    created = camera.created_at
    latest_payload = None
    if latest:
        mapped = serialize_event(latest)
        latest_payload = {
            "type": latest.event_type,
            "severity": mapped["frontendSeverity"],
            "confidence": latest.confidence,
            "timestamp": mapped["timestamp"],
            "description": latest.description or "Simulated privacy-preserving spatial event.",
        }
    stream_type = camera.stream_type or ("demo" if camera.is_simulated else "http")
    status = camera.status or ("demo" if stream_type == "demo" else "offline")
    return {
        "id": camera.camera_id,
        "camera_id": camera.camera_id,
        "cameraCode": camera.camera_code or camera.camera_id,
        "name": camera.name,
        "latitude": camera.latitude,
        "longitude": camera.longitude,
        "coords": {"lat": camera.latitude, "lng": camera.longitude},
        "location_name": camera.location_name,
        "area": camera.area,
        "mandal": camera.mandal,
        "district": camera.district,
        "status": status,
        "last_seen": last_seen.isoformat() if last_seen else None,
        "lastPing": relative_time(last_seen) if last_seen else None,
        "streamFps": camera.stream_fps or 0,
        "resolution": camera.resolution or "1080p",
        "isSimulated": bool(camera.is_simulated if camera.is_simulated is not None else stream_type == "demo"),
        "latestEvent": latest_payload,
        "stream_type": stream_type,
        "stream_url": redact_stream_url(camera.stream_url),
        "is_enabled": bool(camera.is_enabled if camera.is_enabled is not None else 1),
        "last_error": camera.last_error,
        "created_at": created.isoformat() if created else None,
    }


def serialize_emergency(report: EmergencyReport) -> dict:
    created = report.created_at or utc_now()
    updated = report.updated_at or created
    return {
        "id": report.report_id,
        "report_id": report.report_id,
        "category": report.category,
        "description": report.description,
        "severity": report.severity,
        "status": report.status,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "location_name": report.location_name,
        "evidence_url": report.evidence_url,
        "created_at": created.isoformat(),
        "updated_at": updated.isoformat(),
        "isSimulated": bool(report.is_simulated if report.is_simulated is not None else 1),
        "authorityRouting": report.authority_routing or simulated_authority_routing(report.category),
    }


def serialize_news(item: CivicNews) -> dict:
    published = item.published_at or utc_now()
    priority = item.priority or "routine"
    if priority in {"normal", "low"}:
        ui_priority = "routine"
    elif priority in {"medium", "high"}:
        ui_priority = "important"
    else:
        ui_priority = priority
    return {
        "id": item.news_id,
        "news_id": item.news_id,
        "title": item.title,
        "summary": item.summary,
        "source": item.source,
        "geographic_level": item.geographic_level,
        "scope": item.geographic_level,
        "location_name": item.location_name,
        "locationTag": item.location_name or item.geographic_level,
        "latitude": item.latitude,
        "longitude": item.longitude,
        "priority": ui_priority,
        "verified": bool(item.verified),
        "published_at": published.isoformat(),
        "timestamp": relative_time(published),
        "isDemo": bool(item.is_demo if item.is_demo is not None else 1),
    }
