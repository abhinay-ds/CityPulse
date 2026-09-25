from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.pulse_service import compute_pulse
from app.utils.geo import valid_coordinates

router = APIRouter(prefix="/api/pulse", tags=["Pulse Score"])


@router.get("")
def pulse_score(
    latitude: float = Query(default=18.5204, ge=-90, le=90),
    longitude: float = Query(default=73.8567, ge=-180, le=180),
    db: Session = Depends(get_db),
):
    if not valid_coordinates(latitude, longitude):
        raise HTTPException(status_code=422, detail="Invalid coordinates")
    return compute_pulse(db, latitude, longitude)
