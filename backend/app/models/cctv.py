from app.utils.clock import utc_now

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class CctvCamera(Base):
    __tablename__ = "cctv_cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(30), default="demo")
    location_name = Column(String(255), nullable=True)
    area = Column(String(255), nullable=True)
    mandal = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    camera_code = Column(String(50), nullable=True)
    stream_fps = Column(Integer, default=24)
    resolution = Column(String(100), default="1080p")
    is_simulated = Column(Integer, default=1)
    stream_type = Column(String(20), default="demo", nullable=False)
    stream_url = Column(String(2000), nullable=True)
    is_enabled = Column(Integer, default=1)
    last_error = Column(Text, nullable=True)
    last_seen = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)


class CctvEvent(Base):
    __tablename__ = "cctv_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False)
    camera_id = Column(String(50), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    severity = Column(String(30), default="medium")
    confidence = Column(Float, default=0.0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    is_simulated = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now)
