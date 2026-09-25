from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SeverityLevel = Literal["normal", "low", "medium", "high", "critical"]

IncidentCategory = Literal[
    "Fire / Smoke",
    "Flood",
    "Heavy Rain",
    "Earthquake",
    "Cyclone",
    "Landslide",
    "Gas Leak",
    "Major Road Accident",
    "Road Blockage",
    "Infrastructure Damage",
    "Other Emergency",
]

ReportLifecycleStatus = Literal[
    "REPORT RECEIVED",
    "REPORTED",
    "UNDER REVIEW",
    "VERIFIED",
    "RESPONSE INITIATED",
    "RESOLVED",
]

SourceType = Literal[
    "citizen",
    "cctv_ai",
    "sensor_weather",
    "traffic_sensor",
    "municipal_feed",
]


class GeoCoordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class AuthorityRoutingInfo(BaseModel):
    department: str
    routingStatus: Literal["prepared", "dispatched", "simulated", "acknowledged"]
    assignedUnit: str | None = None
    etaMinutes: int | None = None
    isSimulated: bool = True
    actionGuidance: str


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    id: str
    category: IncidentCategory
    title: str
    description: str
    locationName: str
    hierarchy: dict[str, str]
    coords: GeoCoordinates
    distanceKm: float | None = None
    timestamp: str
    reportedAtIso: str
    severity: SeverityLevel
    confidencePercent: float
    status: ReportLifecycleStatus
    evidenceMediaUrl: str | None = None
    authorityRouting: AuthorityRoutingInfo
    possibleImpact: str
    whatToDo: str
    verifiedBy: str | None = None
    sourceType: SourceType


class IncidentCreate(BaseModel):
    category: IncidentCategory
    title: str | None = None
    description: str
    locationName: str | None = None
    area: str | None = None
    mandal: str | None = None
    district: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    coords: GeoCoordinates | None = None
    severity: SeverityLevel = "medium"
    confidencePercent: float = 75
    evidenceMediaUrl: str | None = None
    sourceType: SourceType = "citizen"
    authorityRouting: AuthorityRoutingInfo | None = None
    possibleImpact: str = ""
    whatToDo: str = ""


class IncidentStatusUpdate(BaseModel):
    status: ReportLifecycleStatus
