from app.utils.clock import utc_now

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.news import CivicNews
from app.schemas.news import NewsCreate, NewsResponse
from app.utils.ids import make_id
from app.utils.serializers import serialize_news

router = APIRouter(prefix="/api/news", tags=["News"])


@router.get("", response_model=list[NewsResponse])
def list_news(
    district: str | None = None,
    area: str | None = None,
    geographic_level: str | None = None,
    priority: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(CivicNews)
    if geographic_level:
        query = query.filter(CivicNews.geographic_level == geographic_level)
    if priority:
        query = query.filter(CivicNews.priority == priority)
    if district:
        query = query.filter(CivicNews.location_name == district)
    if area:
        query = query.filter(CivicNews.location_name == area)
    items = query.order_by(CivicNews.published_at.desc()).all()
    return [serialize_news(item) for item in items]


@router.get("/{news_id}", response_model=NewsResponse)
def get_news(news_id: str, db: Session = Depends(get_db)):
    item = db.query(CivicNews).filter(CivicNews.news_id == news_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="News item not found")
    return serialize_news(item)


@router.post("", response_model=NewsResponse, status_code=201)
def create_news(data: NewsCreate, db: Session = Depends(get_db)):
    item = CivicNews(
        news_id=make_id("NEWS"),
        title=data.title,
        summary=data.summary,
        source=data.source,
        geographic_level=data.geographic_level,
        location_name=data.location_name,
        latitude=data.latitude,
        longitude=data.longitude,
        priority=data.priority,
        verified=1 if data.verified else 0,
        is_demo=0,
        published_at=utc_now(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_news(item)
