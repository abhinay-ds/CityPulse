from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


NewsPriority = Literal["routine", "important", "breaking", "normal", "low", "medium", "high"]
NewsLevel = Literal["Area", "Mandal", "District", "Nearby", "State"]


class NewsCreate(BaseModel):
    title: str
    summary: str
    source: str
    geographic_level: NewsLevel = "Area"
    location_name: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    priority: NewsPriority = "routine"
    verified: bool = False


class NewsResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    news_id: str
    title: str
    summary: str
    source: str
    geographic_level: str
    location_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    priority: str
    verified: bool
    published_at: str
    isDemo: bool = True
    scope: str | None = None
    locationTag: str | None = None
    timestamp: str | None = None
