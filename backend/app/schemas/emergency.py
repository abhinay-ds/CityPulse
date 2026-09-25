from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


EmergencyStatus = Literal[
    "reported",
    "under_review",
    "verified",
    "response_initiated",
    "resolved",
]


class EmergencyCreate(BaseModel):
    category: Literal[
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
    description: str
    severity: Literal["normal", "low", "medium", "high", "critical"] = "medium"
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_name: str | None = None
    evidence_url: str | None = None


class EmergencyResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    report_id: str
    category: str
    description: str
    severity: str
    status: str
    latitude: float
    longitude: float
    location_name: str | None = None
    evidence_url: str | None = None
    created_at: str
    updated_at: str | None = None
    isSimulated: bool = True
    authorityRouting: dict | None = None


class EmergencyStatusUpdate(BaseModel):
    status: EmergencyStatus
