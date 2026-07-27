"""Health check endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.db.session import check_database_connection

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(..., examples=["healthy", "degraded"])
    app: str
    version: str
    environment: str
    timestamp: datetime
    database: str = Field(..., examples=["connected", "unreachable"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Returns application and database health status.",
    openapi_extra={"security": []},
)
async def health_check() -> HealthResponse:
    """Check API and database availability."""
    settings = get_settings()
    db_ok = await check_database_connection()

    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        timestamp=datetime.now(timezone.utc),
        database="connected" if db_ok else "unreachable",
    )
