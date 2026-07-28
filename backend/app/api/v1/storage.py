"""Supabase Storage health probe."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.services.storage import get_storage_service

router = APIRouter(prefix="/storage", tags=["Storage"])


@router.get(
    "/health",
    summary="Supabase Storage health",
    description=(
        "Reports whether Supabase Storage is reachable and the required "
        "buckets (`songs`, `covers`, `avatars`) exist. "
        "Files are stored securely in Supabase Storage."
    ),
    responses={
        200: {
            "description": "Health snapshot",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "storage": "supabase",
                    }
                }
            },
        }
    },
    openapi_extra={"security": []},
)
async def storage_health() -> dict[str, Any]:
    result = await get_storage_service().health()
    if result.get("status") == "healthy":
        return {"status": "healthy", "storage": "supabase"}
    return result
