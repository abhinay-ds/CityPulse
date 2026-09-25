from __future__ import annotations

import logging
import socket
from app.utils.clock import utc_now
from urllib.parse import urlsplit, urlunsplit

import httpx
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.cctv import CctvCamera, CctvEvent
from app.models.incident import Incident
from app.services.cctv_detector import (
    EVENT_TO_INCIDENT_CATEGORY,
    Detection,
    NullCctvDetector,
    normalize_event_type,
)
from app.services.realtime import publish
from app.utils.ids import make_id
from app.utils.routing import simulated_authority_routing

logger = logging.getLogger("citypulse.cctv")

CONNECT_TIMEOUT_SECONDS = 3.0
FORBIDDEN_SCHEMES = {"file", "data", "javascript", "ftp", "smb", "nfs", "unix"}

# In-memory processing sessions. No background workers; connect/disconnect only.
_active_sessions: set[str] = set()
_detector = NullCctvDetector()


def opencv_available() -> bool:
    try:
        import cv2  # noqa: F401
    except Exception:
        return False
    return True


def redact_stream_url(url: str | None) -> str | None:
    """Return a display URL with userinfo stripped. Never expose credentials."""
    if not url:
        return None
    parts = urlsplit(url)
    if not parts.username and not parts.password:
        return url
    host = parts.hostname or ""
    netloc = f"{host}:{parts.port}" if parts.port else host
    return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))


def validate_stream_url(stream_type: str, stream_url: str | None) -> str | None:
    if stream_type == "demo":
        return stream_url.strip() if stream_url and stream_url.strip() else None

    if not stream_url or not stream_url.strip():
        raise ValueError("stream_url is required when stream_type is rtsp or http")

    url = stream_url.strip()
    if url.startswith(("file:", "/", "\\")) or (len(url) > 1 and url[1] == ":"):
        raise ValueError("Filesystem paths are not allowed as stream_url")

    parts = urlsplit(url)
    scheme = (parts.scheme or "").lower()
    if scheme in FORBIDDEN_SCHEMES or not scheme:
        raise ValueError("Unsupported or unsafe stream URL scheme")
    if not parts.hostname:
        raise ValueError("stream_url must include a host")
    if stream_type == "rtsp" and scheme not in {"rtsp", "rtsps"}:
        raise ValueError("RTSP cameras require an rtsp:// or rtsps:// URL")
    if stream_type == "http" and scheme not in {"http", "https"}:
        raise ValueError("HTTP cameras require an http:// or https:// URL")
    return url


def default_status_for_stream(stream_type: str) -> str:
    if stream_type == "demo":
        return "demo"
    return "offline"


def apply_camera_stream_fields(camera: CctvCamera, stream_type: str, stream_url: str | None) -> None:
    camera.stream_type = stream_type
    camera.stream_url = validate_stream_url(stream_type, stream_url)
    camera.is_simulated = 1 if stream_type == "demo" else 0
    if stream_type == "demo":
        camera.status = "demo" if camera.is_enabled else "offline"
        camera.last_error = None
    elif camera.status == "online":
        # Configuration changed; do not keep a previous live claim.
        camera.status = "offline"
        camera.last_error = "Stream configuration changed; reconnect required."


def _probe_rtsp(url: str, timeout: float = CONNECT_TIMEOUT_SECONDS) -> None:
    parts = urlsplit(url)
    host = parts.hostname
    if not host:
        raise ConnectionError("RTSP URL has no host")
    port = parts.port or (322 if (parts.scheme or "").lower() == "rtsps" else 554)
    path = parts.path or "/"
    target = f"rtsp://{host}:{port}{path}"
    if parts.query:
        target = f"{target}?{parts.query}"
    request = f"OPTIONS {target} RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: CityPulse\r\n\r\n"
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.settimeout(timeout)
        sock.sendall(request.encode("ascii", errors="ignore"))
        data = sock.recv(512)
    if not data:
        raise ConnectionError("RTSP source returned no response")
    text = data.decode("ascii", errors="ignore")
    if "RTSP/" not in text:
        raise ConnectionError("Host did not respond with RTSP")


def _probe_http(url: str, timeout: float = CONNECT_TIMEOUT_SECONDS) -> None:
    parts = urlsplit(url)
    if (parts.scheme or "").lower() not in {"http", "https"}:
        raise ConnectionError("HTTP probe refused non-HTTP URL")
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        response = client.get(url, headers={"Range": "bytes=0-128"})
    if response.status_code >= 400:
        raise ConnectionError(f"HTTP source returned status {response.status_code}")


def test_stream_connection(stream_type: str, stream_url: str | None) -> tuple[bool, str | None]:
    """Verify the configured source. Never treat a URL as live just because it exists."""
    if stream_type == "demo":
        return True, None
    try:
        url = validate_stream_url(stream_type, stream_url)
    except ValueError as exc:
        return False, str(exc)
    try:
        if stream_type == "rtsp":
            _probe_rtsp(url or "")
        elif stream_type == "http":
            _probe_http(url or "")
        else:
            return False, f"Unsupported stream_type: {stream_type}"
        return True, None
    except Exception as exc:
        logger.info("CCTV source probe failed: %s", exc.__class__.__name__)
        return False, str(exc)[:400]


def connect_camera(camera: CctvCamera) -> CctvCamera:
    camera.is_enabled = 1
    stream_type = camera.stream_type or "demo"
    if stream_type == "demo":
        camera.status = "demo"
        camera.last_error = None
        camera.last_seen = utc_now()
        _active_sessions.add(camera.camera_id)
        return camera

    camera.status = "connecting"
    camera.last_error = None
    ok, error = test_stream_connection(stream_type, camera.stream_url)
    if ok:
        camera.status = "online"
        camera.last_error = None
        camera.last_seen = utc_now()
        _active_sessions.add(camera.camera_id)
    else:
        camera.status = "offline"
        camera.last_error = error or "Unable to reach configured stream"
        _active_sessions.discard(camera.camera_id)
    return camera


def disconnect_camera(camera: CctvCamera) -> CctvCamera:
    _active_sessions.discard(camera.camera_id)
    camera.is_enabled = 0
    if (camera.stream_type or "demo") == "demo":
        camera.status = "demo"
        camera.last_error = "Disconnected from demo processing"
    else:
        camera.status = "offline"
        camera.last_error = "Disconnected by operator"
    return camera


def disable_camera(camera: CctvCamera) -> CctvCamera:
    disconnect_camera(camera)
    camera.is_enabled = 0
    if (camera.stream_type or "demo") != "demo":
        camera.status = "offline"
    return camera


def is_processing(camera_id: str) -> bool:
    return camera_id in _active_sessions


def process_frame(db: Session, camera: CctvCamera, frame) -> list[CctvEvent]:
    """Run the configured detector on a frame.

    NullCctvDetector returns no detections, so real cameras never get invented events.
    """
    if (camera.stream_type or "demo") == "demo":
        return []
    detections = _detector.detect(frame)
    return ingest_detections(db, camera, detections)


def ingest_detections(db: Session, camera: CctvCamera, detections: list[Detection]) -> list[CctvEvent]:
    events: list[CctvEvent] = []
    for item in detections:
        event = CctvEvent(
            event_id=make_id("CCTV"),
            camera_id=camera.camera_id,
            event_type=normalize_event_type(item.event_type),
            severity=item.severity,
            confidence=item.confidence,
            latitude=camera.latitude,
            longitude=camera.longitude,
            description=item.description or "Privacy-preserving spatial detection from CCTV.",
            is_simulated=0,
            created_at=utc_now(),
        )
        db.add(event)
        events.append(event)
        incident = promote_genuine_event(db, camera, event)
        publish("cctv.event", {"id": event.event_id, "camera_id": camera.camera_id})
        if incident:
            publish("incident.created", {"id": incident.incident_id})
    camera.last_seen = utc_now()
    return events


def promote_genuine_event(
    db: Session,
    camera: CctvCamera,
    event: CctvEvent,
    *,
    min_confidence: float = 85,
) -> Incident | None:
    """CctvEvent → Incident → Alert when a real detector produces a high-confidence event.

    Demo/simulated events are not auto-promoted.
    """
    if event.is_simulated:
        return None
    if (event.confidence or 0) < min_confidence:
        return None
    category = EVENT_TO_INCIDENT_CATEGORY.get(normalize_event_type(event.event_type), "Other Emergency")
    now = utc_now()
    incident = Incident(
        incident_id=make_id("INC"),
        category=category,
        title=f"CCTV {event.event_type.replace('_', ' ')} at {camera.location_name or camera.name}",
        description=event.description or f"High-confidence CCTV event ({event.event_type}).",
        location_name=camera.location_name or camera.name,
        area=camera.area or "Local Area",
        mandal=camera.mandal or "Local Mandal",
        district=camera.district or "Local District",
        latitude=event.latitude,
        longitude=event.longitude,
        severity=event.severity if event.severity in {"low", "medium", "high", "critical"} else "medium",
        confidence_percent=event.confidence,
        status="REPORTED",
        source_type="cctv_ai",
        possible_impact="Civic personnel assessing locality from verified CCTV signal.",
        what_to_do="Avoid the immediate zone. Keep access roads clear for civic units.",
        authority_routing=simulated_authority_routing(category),
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    alert = Alert(
        alert_id=make_id("ALT"),
        title=incident.title,
        message=incident.description,
        category=category.split(" / ")[0] if category else "Civic",
        priority="high" if (event.severity or "") in {"high", "critical"} else "medium",
        status="active",
        latitude=event.latitude,
        longitude=event.longitude,
        location_name=incident.location_name,
        area=incident.area,
        district=incident.district,
        source="CCTV detector",
        icon_type="hazard",
        created_at=now,
    )
    db.add(alert)
    return incident
