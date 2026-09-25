import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import Base, engine, ensure_sqlite_columns
from app.models import (
    Alert,
    CctvCamera,
    CctvEvent,
    CivicNews,
    EmergencyReport,
    Incident,
    User,
)  # noqa: F401
from app.routes.alerts import router as alerts_router
from app.routes.cctv import router as cctv_router
from app.routes.emergency import router as emergency_router
from app.routes.incidents import router as incidents_router
from app.routes.insights import router as insights_router
from app.routes.location import router as location_router
from app.routes.news import router as news_router
from app.routes.pulse import router as pulse_router
from app.routes.traffic import router as traffic_router
from app.routes.weather import router as weather_router
from app.routes.stream import router as stream_router
from app.routes.auth import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("citypulse")

Base.metadata.create_all(bind=engine)
ensure_sqlite_columns()

app = FastAPI(
    title="CityPulse API",
    description="Backend API for the CityPulse civic intelligence platform",
    version=settings.app_version,
)

configured_origins = [
    item.strip()
    for item in settings.cors_origins.split(",")
    if item.strip()
]

# Allow the local Vite dev server on any port (5173, 5174, etc.)
# and the production Vercel frontend.
required_origins = [
    "https://citypulse-rouge.vercel.app",
]
origins = list(dict.fromkeys(configured_origins + required_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(location_router)
app.include_router(cctv_router)
app.include_router(emergency_router)
app.include_router(news_router)
app.include_router(weather_router)
app.include_router(traffic_router)
app.include_router(pulse_router)
app.include_router(insights_router)
app.include_router(stream_router)

app.include_router(auth_router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


def _json_safe(value):
    if isinstance(value, Exception):
        return str(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Invalid request payload",
            "details": _json_safe(exc.errors()),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )


@app.get("/")
def root():
    return {
        "success": True,
        "message": "CityPulse API is running",
        "version": settings.app_version,
    }


@app.get("/api/health")
def health():
    return {
        "success": True,
        "service": "citypulse-api",
        "status": "healthy",
    }
