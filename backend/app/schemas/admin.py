"""Admin API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class AdminUserOut(BaseModel):
    """User row for the admin panel."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    display_name: str
    avatar_url: str | None = None
    role: UserRole
    is_active: bool
    total_listen_seconds: int = 0
    created_at: datetime
    updated_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserOut]
    total: int
    skip: int
    limit: int


class AdminUserUpdate(BaseModel):
    """Activate or deactivate a user account."""

    is_active: bool | None = None


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_listen_seconds: int
    total_song_plays: int = Field(
        description="Sum of song.play_count across the catalog",
    )
