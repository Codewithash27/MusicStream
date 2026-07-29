"""Playlist API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.song import SongResponse


class PlaylistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = None
    is_public: bool = True


class PlaylistUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = None
    is_public: bool | None = None


class AddSongToPlaylist(BaseModel):
    song_id: uuid.UUID


class PlaylistOwnerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    display_name: str


class PlaylistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    cover_url: str | None = None
    is_public: bool
    created_at: datetime
    updated_at: datetime
    song_count: int = 0
    preview_cover_urls: list[str | None] = Field(default_factory=list)
    owner: PlaylistOwnerBrief | None = None


class PlaylistDetailResponse(PlaylistResponse):
    songs: list[SongResponse] = Field(default_factory=list)


class PlaylistListResponse(BaseModel):
    items: list[PlaylistResponse]
    total: int
    skip: int
    limit: int
