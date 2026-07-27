"""User-facing Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserPublic(BaseModel):
    """Safe user representation for API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    display_name: str
    avatar_url: str | None = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
