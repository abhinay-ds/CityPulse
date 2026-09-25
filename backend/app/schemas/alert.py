from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AlertCategory = Literal[
    "Weather",
    "Traffic",
    "Safety",
    "Civic",
    "Emergency",
    "Infrastructure",
    "Other",
]

AlertPriority = Literal["low", "medium", "high", "critical"]
AlertStatus = Literal["active", "resolved", "expired"]


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    id: str
    title: str
    message: str
    category: AlertCategory
    priority: AlertPriority
    latitude: float | None = None
    longitude: float | None = None
    locationName: str | None = None
    status: AlertStatus
    createdAt: datetime
    description: str | None = None
    area: str | None = None
    district: str | None = None
    source: str | None = None
    iconType: str | None = None
    isSimulated: bool = True


class AlertCreate(BaseModel):
    title: str
    message: str
    category: AlertCategory
    priority: AlertPriority = "medium"
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    locationName: str | None = None
    area: str | None = None
    district: str | None = None
    status: AlertStatus = "active"
    source: str | None = None
    iconType: str | None = None


class AlertStatusUpdate(BaseModel):
    status: AlertStatus
