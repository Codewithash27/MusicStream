"""Album API schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.song import ArtistBrief, SongResponse


class AlbumResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    artist_id: uuid.UUID
    title: str
    description: str | None = None
    cover_url: str | None = None
    release_date: date | None = None
    created_at: datetime
    updated_at: datetime
    artist: ArtistBrief | None = None
    track_count: int = 0


class AlbumDetailResponse(AlbumResponse):
    songs: list[SongResponse] = Field(default_factory=list)


class AlbumListResponse(BaseModel):
    items: list[AlbumResponse]
    total: int
    skip: int
    limit: int
