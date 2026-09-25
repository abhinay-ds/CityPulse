from fastapi import APIRouter, HTTPException

from app.schemas.location import LocationResolveRequest, LocationResolveResponse
from app.services.location_service import resolve_location

router = APIRouter(tags=["Location"])


@router.post("/api/v1/location/resolve", response_model=LocationResolveResponse)
def resolve_location_v1(payload: LocationResolveRequest):
    try:
        return resolve_location(payload.latitude, payload.longitude)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/location/resolve", response_model=LocationResolveResponse)
def resolve_location_compat(payload: LocationResolveRequest):
    return resolve_location_v1(payload)
