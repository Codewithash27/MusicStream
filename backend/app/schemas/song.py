"""Song API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ArtistBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage_name: str
    image_url: str | None = None
    is_verified: bool


class SongResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    artist_id: uuid.UUID
    album_id: uuid.UUID | None = None
    title: str
    duration_seconds: int
    audio_url: str
    cover_url: str | None = None
    track_number: int | None = None
    play_count: int
    created_at: datetime
    updated_at: datetime
    artist: ArtistBrief | None = None


class SongListResponse(BaseModel):
    items: list[SongResponse]
    total: int
    skip: int
    limit: int


class SongUpdate(BaseModel):
    """JSON metadata updates (file replacements use multipart PATCH)."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    duration_seconds: int | None = Field(default=None, ge=1, le=86_400)
    album_id: uuid.UUID | None = None
    track_number: int | None = Field(default=None, ge=1, le=999)
    clear_album: bool = False
    clear_cover: bool = False
