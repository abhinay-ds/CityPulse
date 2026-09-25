from app.utils.clock import utc_now

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(30), default="medium")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)
    area = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    status = Column(String(30), default="active")
    source = Column(String(255), nullable=True)
    icon_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)
