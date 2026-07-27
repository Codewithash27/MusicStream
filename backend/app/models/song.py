"""Song ORM model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.album import Album
    from app.models.artist import ArtistProfile
    from app.models.like import Like
    from app.models.playlist import PlaylistSong


class Song(BaseModel):
    """Streamable audio track."""

    __tablename__ = "songs"

    artist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    album_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("albums.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    audio_url: Mapped[str] = mapped_column(Text, nullable=False)
    cover_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    track_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    play_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    # Relationships
    artist: Mapped[ArtistProfile] = relationship(
        "ArtistProfile",
        back_populates="songs",
    )
    album: Mapped[Optional[Album]] = relationship(
        "Album",
        back_populates="songs",
    )
    playlist_entries: Mapped[list[PlaylistSong]] = relationship(
        "PlaylistSong",
        back_populates="song",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    likes: Mapped[list[Like]] = relationship(
        "Like",
        back_populates="song",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Song id={self.id} title={self.title!r}>"
