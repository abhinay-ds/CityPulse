from app.utils.clock import utc_now

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location_name = Column(String(255), nullable=False)
    area = Column(String(255), nullable=False)
    mandal = Column(String(255), nullable=False)
    district = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String(30), nullable=False)
    confidence_percent = Column(Float, default=0)
    status = Column(String(50), default="REPORTED")
    possible_impact = Column(Text, nullable=True)
    what_to_do = Column(Text, nullable=True)
    source_type = Column(String(50), default="citizen")
    evidence_media_url = Column(String(500), nullable=True)
    authority_routing = Column(JSON, nullable=True)
    verified_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
