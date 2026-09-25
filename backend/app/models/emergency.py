from app.utils.clock import utc_now

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

from app.database import Base


class EmergencyReport(Base):
    __tablename__ = "emergency_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(30), default="medium")
    status = Column(String(50), default="reported")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    evidence_url = Column(String(500), nullable=True)
    is_simulated = Column(Integer, default=1)
    authority_routing = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
