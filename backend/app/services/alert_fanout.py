from __future__ import annotations

from datetime import timedelta
from app.utils.clock import utc_now

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.incident import Incident
from app.utils.ids import make_id


def _alert_category(incident_category: str) -> str:
    if incident_category in {"Heavy Rain", "Flood", "Cyclone"}:
        return "Weather"
    if incident_category in {"Major Road Accident", "Road Blockage"}:
        return "Traffic"
    if incident_category == "Infrastructure Damage":
        return "Infrastructure"
    return "Emergency"


def _icon_type(incident_category: str) -> str:
    if incident_category == "Fire / Smoke":
        return "fire"
    if incident_category in {"Flood", "Heavy Rain"}:
        return "flood"
    if incident_category in {"Major Road Accident", "Road Blockage"}:
        return "traffic"
    return "hazard"


def find_duplicate_alert(
    db: Session,
    *,
    title: str,
    area: str | None,
    latitude: float | None,
    longitude: float | None,
) -> Alert | None:
    cutoff = utc_now() - timedelta(hours=2)
    query = db.query(Alert).filter(
        Alert.title == title,
        Alert.status == "active",
        Alert.created_at >= cutoff,
    )
    if area:
        query = query.filter(Alert.area == area)
    if latitude is not None and longitude is not None:
        query = query.filter(Alert.latitude == latitude, Alert.longitude == longitude)
    return query.order_by(Alert.created_at.desc()).first()


def ensure_incident_alert(db: Session, incident: Incident) -> Alert | None:
    title = f"{incident.category} reported"
    existing = find_duplicate_alert(
        db,
        title=title,
        area=incident.area,
        latitude=incident.latitude,
        longitude=incident.longitude,
    )
    if existing:
        return None
    alert = Alert(
        alert_id=make_id("ALT"),
        title=title,
        message=incident.description,
        category=_alert_category(incident.category),
        priority="high" if incident.severity in {"high", "critical"} else "medium",
        latitude=incident.latitude,
        longitude=incident.longitude,
        location_name=incident.location_name,
        area=incident.area,
        district=incident.district,
        status="active",
        source="Citizen Safety Report" if incident.source_type == "citizen" else "CityPulse Civic Grid",
        icon_type=_icon_type(incident.category),
        created_at=utc_now(),
    )
    db.add(alert)
    return alert
