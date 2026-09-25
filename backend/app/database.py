from __future__ import annotations

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_columns() -> None:
    """Add newly introduced columns on existing SQLite databases."""
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    desired: dict[str, list[tuple[str, str]]] = {
        "incidents": [("updated_at", "DATETIME")],
        "alerts": [
            ("area", "VARCHAR(255)"),
            ("district", "VARCHAR(255)"),
            ("source", "VARCHAR(255)"),
            ("icon_type", "VARCHAR(50)"),
        ],
        "cctv_cameras": [
            ("area", "VARCHAR(255)"),
            ("mandal", "VARCHAR(255)"),
            ("district", "VARCHAR(255)"),
            ("camera_code", "VARCHAR(50)"),
            ("stream_fps", "INTEGER"),
            ("resolution", "VARCHAR(100)"),
            ("is_simulated", "INTEGER"),
            ("stream_type", "VARCHAR(20)"),
            ("stream_url", "VARCHAR(2000)"),
            ("is_enabled", "INTEGER"),
            ("last_error", "TEXT"),
            ("created_at", "DATETIME"),
        ],
        "cctv_events": [("is_simulated", "INTEGER")],
        "emergency_reports": [
            ("updated_at", "DATETIME"),
            ("is_simulated", "INTEGER"),
            ("authority_routing", "JSON"),
        ],
        "civic_news": [("is_demo", "INTEGER")],
    }

    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, columns in desired.items():
            if table not in existing_tables:
                continue
            present = {col["name"] for col in inspector.get_columns(table)}
            for name, col_type in columns:
                if name not in present:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {col_type}"))

        if "cctv_cameras" in existing_tables:
            conn.execute(
                text(
                    """
                    UPDATE cctv_cameras
                    SET stream_type = COALESCE(stream_type, CASE WHEN is_simulated = 0 THEN 'http' ELSE 'demo' END),
                        is_enabled = COALESCE(is_enabled, 1),
                        created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
                    """
                )
            )
            conn.execute(
                text(
                    """
                    UPDATE cctv_cameras
                    SET status = 'demo'
                    WHERE COALESCE(stream_type, 'demo') = 'demo'
                      AND COALESCE(is_simulated, 1) = 1
                      AND LOWER(COALESCE(status, '')) = 'online'
                    """
                )
            )
