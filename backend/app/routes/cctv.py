from app.utils.clock import utc_now

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cctv import CctvCamera, CctvEvent
from app.schemas.cctv import (
    CameraConnectionResponse,
    CameraCreate,
    CameraStatusResponse,
    CameraUpdate,
    CctvCameraResponse,
    CctvEventCreate,
    CctvEventResponse,
)
from app.services.cctv_service import (
    apply_camera_stream_fields,
    connect_camera,
    default_status_for_stream,
    disconnect_camera,
    validate_stream_url,
)
from app.services.realtime import publish
from app.utils.ids import make_id
from app.utils.serializers import serialize_camera, serialize_event

router = APIRouter(prefix="/api/cctv", tags=["CCTV"])


def _latest_events_map(db: Session) -> dict[str, CctvEvent]:
    events = db.query(CctvEvent).order_by(CctvEvent.created_at.desc()).all()
    latest: dict[str, CctvEvent] = {}
    for event in events:
        if event.camera_id not in latest:
            latest[event.camera_id] = event
    return latest


def _get_camera_or_404(db: Session, camera_id: str) -> CctvCamera:
    camera = db.query(CctvCamera).filter(CctvCamera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


def _connection_payload(camera: CctvCamera, connected: bool, message: str) -> dict:
    return {
        "camera_id": camera.camera_id,
        "status": camera.status,
        "stream_type": camera.stream_type or "demo",
        "connected": connected,
        "last_seen": camera.last_seen.isoformat() if camera.last_seen else None,
        "last_error": camera.last_error,
        "message": message,
    }


@router.get("/cameras", response_model=list[CctvCameraResponse])
def list_cameras(db: Session = Depends(get_db)):
    cameras = db.query(CctvCamera).order_by(CctvCamera.camera_id.asc()).all()
    latest = _latest_events_map(db)
    return [serialize_camera(cam, latest.get(cam.camera_id)) for cam in cameras]


@router.post("/cameras", response_model=CctvCameraResponse, status_code=201)
def create_camera(data: CameraCreate, db: Session = Depends(get_db)):
    camera_id = (data.camera_id or make_id("CAM")).strip()
    existing = db.query(CctvCamera).filter(CctvCamera.camera_id == camera_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Camera already exists")
    try:
        stream_url = validate_stream_url(data.stream_type, data.stream_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    now = utc_now()
    camera = CctvCamera(
        camera_id=camera_id,
        name=data.name,
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=data.location_name,
        area=data.area,
        mandal=data.mandal,
        district=data.district,
        camera_code=data.camera_code or camera_id,
        stream_fps=data.stream_fps if data.stream_fps is not None else 24,
        resolution=data.resolution or "1080p",
        is_enabled=1 if data.is_enabled else 0,
        stream_type=data.stream_type,
        stream_url=stream_url,
        is_simulated=1 if data.stream_type == "demo" else 0,
        status=default_status_for_stream(data.stream_type),
        last_error=None,
        last_seen=now if data.stream_type == "demo" else None,
        created_at=now,
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return serialize_camera(camera)


@router.get("/cameras/{camera_id}", response_model=CctvCameraResponse)
def get_camera(camera_id: str, db: Session = Depends(get_db)):
    camera = _get_camera_or_404(db, camera_id)
    latest = (
        db.query(CctvEvent)
        .filter(CctvEvent.camera_id == camera_id)
        .order_by(CctvEvent.created_at.desc())
        .first()
    )
    return serialize_camera(camera, latest)


@router.patch("/cameras/{camera_id}", response_model=CctvCameraResponse)
def update_camera(camera_id: str, data: CameraUpdate, db: Session = Depends(get_db)):
    camera = _get_camera_or_404(db, camera_id)
    updates = data.model_dump(exclude_unset=True)
    stream_type = updates.get("stream_type", camera.stream_type or "demo")
    stream_url = updates["stream_url"] if "stream_url" in updates else camera.stream_url
    try:
        validate_stream_url(stream_type, stream_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    for field in (
        "name",
        "latitude",
        "longitude",
        "location_name",
        "area",
        "mandal",
        "district",
        "stream_fps",
        "resolution",
        "camera_code",
    ):
        if field in updates:
            setattr(camera, field, updates[field])
    if "is_enabled" in updates:
        camera.is_enabled = 1 if updates["is_enabled"] else 0
    if "stream_type" in updates or "stream_url" in updates:
        apply_camera_stream_fields(camera, stream_type, stream_url)
    db.commit()
    db.refresh(camera)
    latest = (
        db.query(CctvEvent)
        .filter(CctvEvent.camera_id == camera_id)
        .order_by(CctvEvent.created_at.desc())
        .first()
    )
    return serialize_camera(camera, latest)


@router.delete("/cameras/{camera_id}")
def delete_camera(camera_id: str, db: Session = Depends(get_db)):
    camera = _get_camera_or_404(db, camera_id)
    payload = serialize_camera(camera)
    db.query(CctvEvent).filter(CctvEvent.camera_id == camera_id).delete()
    db.delete(camera)
    db.commit()
    return {"success": True, "deleted": payload["camera_id"]}


@router.post("/cameras/{camera_id}/connect", response_model=CameraConnectionResponse)
def connect_camera_route(camera_id: str, db: Session = Depends(get_db)):
    camera = _get_camera_or_404(db, camera_id)
    connect_camera(camera)
    db.commit()
    db.refresh(camera)
    connected = camera.status in {"demo", "online"}
    message = (
        "Demo camera ready"
        if camera.stream_type == "demo"
        else ("Connected to configured source" if connected else "Unable to reach configured source")
    )
    return _connection_payload(camera, connected, message)


@router.post("/cameras/{camera_id}/disconnect", response_model=CameraConnectionResponse)
def disconnect_camera_route(camera_id: str, db: Session = Depends(get_db)):
    camera = _get_camera_or_404(db, camera_id)
    disconnect_camera(camera)
    db.commit()
    db.refresh(camera)
    return _connection_payload(camera, False, "Processing disconnected")


@router.get("/cameras/{camera_id}/status", response_model=CameraStatusResponse)
def camera_status(camera_id: str, db: Session = Depends(get_db)):
    camera = _get_camera_or_404(db, camera_id)
    return {
        "camera_id": camera.camera_id,
        "status": camera.status,
        "stream_type": camera.stream_type or "demo",
        "last_seen": camera.last_seen.isoformat() if camera.last_seen else None,
        "last_error": camera.last_error,
        "is_enabled": bool(camera.is_enabled if camera.is_enabled is not None else 1),
    }


@router.get("/events", response_model=list[CctvEventResponse])
def list_events(camera_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(CctvEvent)
    if camera_id:
        query = query.filter(CctvEvent.camera_id == camera_id)
    events = query.order_by(CctvEvent.created_at.desc()).limit(200).all()
    return [serialize_event(event) for event in events]


@router.get("/events/{event_id}", response_model=CctvEventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(CctvEvent).filter(CctvEvent.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="CCTV event not found")
    return serialize_event(event)


@router.post("/events", response_model=CctvEventResponse, status_code=201)
def create_event(data: CctvEventCreate, db: Session = Depends(get_db)):
    camera = db.query(CctvCamera).filter(CctvCamera.camera_id == data.camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    event = CctvEvent(
        event_id=make_id("CCTV"),
        camera_id=data.camera_id,
        event_type=data.event_type,
        severity=data.severity,
        confidence=data.confidence,
        latitude=data.latitude if data.latitude is not None else camera.latitude,
        longitude=data.longitude if data.longitude is not None else camera.longitude,
        description=data.description or "Simulated privacy-preserving spatial anomaly. No facial identification.",
        is_simulated=1 if data.isSimulated else 0,
        created_at=utc_now(),
    )
    camera.last_seen = utc_now()
    db.add(event)
    db.commit()
    db.refresh(event)
    publish("cctv.event", {"id": event.event_id, "camera_id": event.camera_id})
    return serialize_event(event)
