from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


CameraStatus = Literal["online", "offline", "connecting", "demo"]
StreamType = Literal["demo", "rtsp", "http"]
EventSeverity = Literal["normal", "low", "medium", "high", "critical"]
CctvEventType = Literal[
    "accident",
    "fire",
    "smoke",
    "flood",
    "crowd",
    "road_blockage",
    "infrastructure_damage",
    "other",
]


def _require_stream_url(stream_type: str, stream_url: str | None) -> None:
    if stream_type in {"rtsp", "http"} and not (stream_url and stream_url.strip()):
        raise ValueError("stream_url is required when stream_type is rtsp or http")


class CameraCreate(BaseModel):
    camera_id: str | None = Field(default=None, min_length=3, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_name: str | None = None
    area: str | None = None
    mandal: str | None = None
    district: str | None = None
    stream_type: StreamType = "demo"
    stream_url: str | None = None
    is_enabled: bool = True
    stream_fps: int | None = Field(default=24, ge=0, le=120)
    resolution: str | None = "1080p"
    camera_code: str | None = None

    @model_validator(mode="after")
    def validate_stream(self):
        _require_stream_url(self.stream_type, self.stream_url)
        return self


class CameraUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    location_name: str | None = None
    area: str | None = None
    mandal: str | None = None
    district: str | None = None
    stream_type: StreamType | None = None
    stream_url: str | None = None
    is_enabled: bool | None = None
    stream_fps: int | None = Field(default=None, ge=0, le=120)
    resolution: str | None = None
    camera_code: str | None = None
    status: CameraStatus | None = None


class CameraResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    camera_id: str
    cameraCode: str
    name: str
    latitude: float
    longitude: float
    location_name: str | None = None
    area: str | None = None
    mandal: str | None = None
    district: str | None = None
    status: CameraStatus | str
    last_seen: str | None = None
    lastPing: str | None = None
    streamFps: int | None = 24
    resolution: str | None = "1080p"
    isSimulated: bool = True
    latestEvent: dict | None = None
    coords: dict | None = None
    stream_type: StreamType | str = "demo"
    stream_url: str | None = None
    is_enabled: bool = True
    last_error: str | None = None
    created_at: str | None = None


CctvCameraResponse = CameraResponse


class CameraStatusResponse(BaseModel):
    camera_id: str
    status: CameraStatus | str
    stream_type: StreamType | str
    last_seen: str | None = None
    last_error: str | None = None
    is_enabled: bool = True


class CameraConnectionResponse(BaseModel):
    camera_id: str
    status: CameraStatus | str
    stream_type: StreamType | str
    connected: bool
    last_seen: str | None = None
    last_error: str | None = None
    message: str


class CctvEventResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    event_id: str
    camera_id: str
    event_type: str
    severity: str
    confidence: float
    latitude: float
    longitude: float
    description: str | None = None
    created_at: str
    isSimulated: bool = True


class CctvEventCreate(BaseModel):
    camera_id: str
    event_type: str
    severity: EventSeverity = "medium"
    confidence: float = Field(default=80, ge=0, le=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    description: str | None = None
    isSimulated: bool = True

    @field_validator("event_type")
    @classmethod
    def normalize_event_type(cls, value: str) -> str:
        return (value or "other").strip() or "other"
