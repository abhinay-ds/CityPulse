from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB = BACKEND_ROOT / "citypulse.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "CityPulse API"
    app_version: str = "1.0.0"
    database_url: str = f"sqlite:///{DEFAULT_DB.as_posix()}"
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    llm_api_key: str = ""
    llm_api_url: str = ""
    traffic_api_key: str = ""
    news_api_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://citypulse-rouge.vercel.app"
    auth_secret_key: str = "citypulse-dev-secret-change-in-production"
    access_token_expire_minutes: int = 1440


settings = Settings()
