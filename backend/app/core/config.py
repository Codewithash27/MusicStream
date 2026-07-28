"""Application configuration using Pydantic BaseSettings."""

from functools import lru_cache
from typing import Annotated, List

from pydantic import BeforeValidator, Field
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def _split_csv(value: str | List[str]) -> List[str]:
    """Parse a comma-separated string (or pass through a list)."""
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return value


CsvList = Annotated[List[str], NoDecode, BeforeValidator(_split_csv)]


class Settings(BaseSettings):
    """Central application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="MusicStream", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_debug: bool = Field(default=False, alias="APP_DEBUG")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    # Database
    database_url: str = Field(
        ...,
        alias="DATABASE_URL",
        description="Async PostgreSQL connection string (asyncpg)",
    )

    # JWT
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=30,
        alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7,
        alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS",
    )

    # CORS (comma-separated in .env — NoDecode avoids JSON parsing)
    cors_origins: CsvList = Field(
        default_factory=lambda: ["http://localhost:3000"],
        alias="CORS_ORIGINS",
    )
    cors_allow_credentials: bool = Field(
        default=True,
        alias="CORS_ALLOW_CREDENTIALS",
    )
    cors_allow_methods: CsvList = Field(
        default_factory=lambda: ["*"],
        alias="CORS_ALLOW_METHODS",
    )
    cors_allow_headers: CsvList = Field(
        default_factory=lambda: ["*"],
        alias="CORS_ALLOW_HEADERS",
    )

    # Supabase Storage (required — sole object-storage backend)
    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_storage_bucket_songs: str = Field(
        default="songs",
        alias="SUPABASE_STORAGE_BUCKET_SONGS",
    )
    supabase_storage_bucket_covers: str = Field(
        default="covers",
        alias="SUPABASE_STORAGE_BUCKET_COVERS",
    )
    supabase_storage_bucket_avatars: str = Field(
        default="avatars",
        alias="SUPABASE_STORAGE_BUCKET_AVATARS",
    )

    # Upload limits (bytes) — songs 25MB, covers/avatars 5MB
    max_audio_upload_bytes: int = Field(
        default=25 * 1024 * 1024,
        alias="MAX_AUDIO_UPLOAD_BYTES",
    )
    max_cover_upload_bytes: int = Field(
        default=5 * 1024 * 1024,
        alias="MAX_COVER_UPLOAD_BYTES",
    )
    max_avatar_upload_bytes: int = Field(
        default=5 * 1024 * 1024,
        alias="MAX_AVATAR_UPLOAD_BYTES",
    )

    @property
    def is_production(self) -> bool:
        """Return True when running in production."""
        return self.app_env.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Return True when running in development."""
        return self.app_env.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
