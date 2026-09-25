from app.utils.clock import utc_now

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.emergency import EmergencyReport
from app.schemas.emergency import EmergencyCreate, EmergencyResponse, EmergencyStatusUpdate
from app.services.realtime import publish
from app.utils.ids import make_id
from app.utils.routing import simulated_authority_routing
from app.utils.serializers import serialize_emergency

router = APIRouter(prefix="/api/emergency", tags=["Emergency"])


@router.get("", response_model=list[EmergencyResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(EmergencyReport).order_by(EmergencyReport.created_at.desc()).all()
    return [serialize_emergency(item) for item in reports]


@router.get("/{report_id}", response_model=EmergencyResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(EmergencyReport).filter(EmergencyReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Emergency report not found")
    return serialize_emergency(report)


@router.post("", response_model=EmergencyResponse, status_code=201)
def create_report(data: EmergencyCreate, db: Session = Depends(get_db)):
    now = utc_now()
    report = EmergencyReport(
        report_id=make_id("EMG"),
        category=data.category,
        description=data.description,
        severity=data.severity,
        status="reported",
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=data.location_name,
        evidence_url=data.evidence_url,
        is_simulated=1,
        authority_routing=simulated_authority_routing(data.category),
        created_at=now,
        updated_at=now,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    publish("emergency.created", {"id": report.report_id})
    return serialize_emergency(report)


@router.patch("/{report_id}/status", response_model=EmergencyResponse)
def update_report_status(
    report_id: str,
    data: EmergencyStatusUpdate,
    db: Session = Depends(get_db),
):
    report = db.query(EmergencyReport).filter(EmergencyReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Emergency report not found")
    report.status = data.status
    report.updated_at = utc_now()
    db.commit()
    db.refresh(report)
    return serialize_emergency(report)
