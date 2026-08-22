"""
Central settings object. Every env var listed in CONTRACTS.md §1 must have
a field here — do not read os.environ directly anywhere else in the app.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- database (CONTRACTS §1) ---
    database_url: str = "postgresql+asyncpg://globetrotter:globetrotter@db:5432/globetrotter"

    # --- auth (CONTRACTS §1, §3) ---
    jwt_secret_key: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # --- CORS (CONTRACTS §1) ---
    cors_origins: str = "http://localhost:5173"

    # --- external services (CONTRACTS §1, §7.1, §7.2) ---
    # Required for full functionality, but the app must boot and every
    # non-map/non-assistant route must work without them (ARCHITECTURE §8).
    google_maps_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    groq_model: str = "openai/gpt-oss-20b"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
