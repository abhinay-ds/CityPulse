from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.insight_service import build_insights
from app.utils.geo import valid_coordinates

router = APIRouter(prefix="/api/insights", tags=["Insights"])


class InsightAnalyzeRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


@router.get("")
def get_insights(
    latitude: float = Query(default=18.5204, ge=-90, le=90),
    longitude: float = Query(default=73.8567, ge=-180, le=180),
    db: Session = Depends(get_db),
):
    if not valid_coordinates(latitude, longitude):
        raise HTTPException(status_code=422, detail="Invalid coordinates")
    return build_insights(db, latitude, longitude)


@router.post("/analyze")
def analyze_insights(payload: InsightAnalyzeRequest, db: Session = Depends(get_db)):
    return build_insights(db, payload.latitude, payload.longitude)
