from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator
import json

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "CampusBite"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://campusbite:campusbite@localhost:5432/campusbite_db"
    SYNC_DATABASE_URL: str = "postgresql://campusbite:campusbite@localhost:5432/campusbite_db"

    # Security
    SECRET_KEY: str = "campusbite-super-secret-dev-key-change-in-prod-64bytes"
    SESSION_COOKIE_NAME: str = "campusbite_session"
    SESSION_MAX_AGE_SECONDS: int = 3600  # 1 hour inactivity
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Timezone & Regional Defaults
    TIMEZONE: str = "Asia/Kolkata"
    DEFAULT_TAX_PERCENT: float = 5.0
    DEFAULT_CURRENCY_SYMBOL: str = "₹"
    DEFAULT_ORDER_PREFIX: str = "CB"

    # File uploads
    UPLOAD_DIR: str = "uploads/food"
    MAX_UPLOAD_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # AI Configuration (Additive feature)
    AI_PROVIDER: str = "none"  # "gemini" or "none"
    GEMINI_API_KEY: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

settings = Settings()

