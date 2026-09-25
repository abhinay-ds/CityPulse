from pydantic import BaseModel, Field


class LocationResolveRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class LocationResolveResponse(BaseModel):
    area: str
    mandal: str
    district: str
    state: str
    country: str
    display_name: str
    latitude: float
    longitude: float
    isFallback: bool = False
