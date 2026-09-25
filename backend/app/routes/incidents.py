from app.utils.clock import utc_now

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentStatusUpdate
from app.services.alert_fanout import ensure_incident_alert
from app.services.realtime import publish
from app.utils.geo import valid_coordinates
from app.utils.ids import make_id
from app.utils.routing import simulated_authority_routing
from app.utils.serializers import serialize_incident

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=list[IncidentResponse])
def get_incidents(
    latitude: float | None = Query(default=None),
    longitude: float | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    origin = None
    if latitude is not None and longitude is not None and valid_coordinates(latitude, longitude):
        origin = (latitude, longitude)
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(limit).all()
    return [serialize_incident(item, origin) for item in incidents]


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return serialize_incident(incident)


@router.post("", response_model=IncidentResponse, status_code=201)
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    lat = data.latitude if data.latitude is not None else (data.coords.lat if data.coords else None)
    lng = data.longitude if data.longitude is not None else (data.coords.lng if data.coords else None)
    if lat is None or lng is None or not valid_coordinates(lat, lng):
        raise HTTPException(status_code=400, detail="Valid latitude and longitude are required")

    routing = (
        data.authorityRouting.model_dump()
        if data.authorityRouting
        else simulated_authority_routing(data.category)
    )
    now = utc_now()
    incident = Incident(
        incident_id=make_id("INC"),
        category=data.category,
        title=data.title or f"{data.category} reported",
        description=data.description,
        location_name=data.locationName or data.area or "Reported location",
        area=data.area or "Local Area",
        mandal=data.mandal or "Local Mandal",
        district=data.district or "Local District",
        latitude=lat,
        longitude=lng,
        severity=data.severity,
        confidence_percent=data.confidencePercent,
        status="REPORTED",
        possible_impact=data.possibleImpact or "Civic personnel assessing locality perimeter.",
        what_to_do=data.whatToDo
        or "Avoid approaching the immediate zone. Keep access roads clear for civic units.",
        source_type=data.sourceType,
        evidence_media_url=data.evidenceMediaUrl,
        authority_routing=routing,
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    db.flush()
    ensure_incident_alert(db, incident)
    db.commit()
    db.refresh(incident)
    publish("incident.created", {"id": incident.incident_id})
    return serialize_incident(incident)


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    data: IncidentStatusUpdate,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = data.status
    incident.updated_at = utc_now()
    db.commit()
    db.refresh(incident)
    publish("incident.status", {"id": incident.incident_id, "status": incident.status})
    return serialize_incident(incident)
