from fastapi import APIRouter, HTTPException, Query

from app.services.weather_service import fetch_weather
from app.utils.geo import valid_coordinates

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("")
def get_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    if not valid_coordinates(latitude, longitude):
        raise HTTPException(status_code=422, detail="Invalid coordinates")
    return fetch_weather(latitude, longitude)
