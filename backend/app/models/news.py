from app.utils.clock import utc_now

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class CivicNews(Base):
    __tablename__ = "civic_news"

    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=False)
    source = Column(String(255), nullable=False)
    geographic_level = Column(String(50), nullable=False)
    location_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    priority = Column(String(30), default="normal")
    verified = Column(Integer, default=0)
    is_demo = Column(Integer, default=1)
    published_at = Column(DateTime, default=utc_now)
