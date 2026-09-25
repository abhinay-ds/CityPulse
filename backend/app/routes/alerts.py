from app.utils.clock import utc_now

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertResponse, AlertStatusUpdate
from app.services.alert_fanout import find_duplicate_alert
from app.services.realtime import publish
from app.utils.geo import valid_coordinates
from app.utils.ids import make_id
from app.utils.serializers import serialize_alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertResponse])
def get_alerts(
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    district: str | None = None,
    area: str | None = None,
    latitude: float | None = Query(default=None),
    longitude: float | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if category:
        query = query.filter(Alert.category == category)
    if priority:
        query = query.filter(Alert.priority == priority)
    if district:
        query = query.filter(Alert.district == district)
    if area:
        query = query.filter(Alert.area == area)

    origin = None
    if latitude is not None and longitude is not None and valid_coordinates(latitude, longitude):
        origin = (latitude, longitude)

    alerts = query.order_by(Alert.created_at.desc()).limit(200).all()
    return [serialize_alert(item, origin) for item in alerts]


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return serialize_alert(alert)


@router.post("", response_model=AlertResponse, status_code=201)
def create_alert(data: AlertCreate, db: Session = Depends(get_db)):
    duplicate = find_duplicate_alert(
        db,
        title=data.title,
        area=data.area or data.locationName,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    if duplicate:
        return serialize_alert(duplicate)

    alert = Alert(
        alert_id=make_id("ALT"),
        title=data.title,
        message=data.message,
        category=data.category,
        priority=data.priority,
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=data.locationName,
        area=data.area or data.locationName,
        district=data.district,
        status=data.status,
        source=data.source or "CityPulse Civic Grid",
        icon_type=data.iconType,
        created_at=utc_now(),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    publish("alert.created", {"id": alert.alert_id})
    return serialize_alert(alert)


@router.patch("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(
    alert_id: str,
    data: AlertStatusUpdate,
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = data.status
    db.commit()
    db.refresh(alert)
    return serialize_alert(alert)
