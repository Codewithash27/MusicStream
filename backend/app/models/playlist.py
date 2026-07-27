"""Playlist and PlaylistSong ORM models."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.song import Song
    from app.models.user import User


class Playlist(BaseModel):
    """User-owned ordered collection of songs."""

    __tablename__ = "playlists"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    # Relationships
    owner: Mapped[User] = relationship(
        "User",
        back_populates="playlists",
    )
    playlist_songs: Mapped[list[PlaylistSong]] = relationship(
        "PlaylistSong",
        back_populates="playlist",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PlaylistSong.position",
    )

    def __repr__(self) -> str:
        return f"<Playlist id={self.id} name={self.name!r}>"


class PlaylistSong(BaseModel):
    """
    Many-to-many bridge between Playlist and Song.

    Supports ordering via ``position``.
    """

    __tablename__ = "playlist_songs"
    __table_args__ = (
        UniqueConstraint(
            "playlist_id",
            "song_id",
            name="uq_playlist_songs_playlist_song",
        ),
        UniqueConstraint(
            "playlist_id",
            "position",
            name="uq_playlist_songs_playlist_position",
        ),
    )

    playlist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("playlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    song_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    playlist: Mapped[Playlist] = relationship(
        "Playlist",
        back_populates="playlist_songs",
    )
    song: Mapped[Song] = relationship(
        "Song",
        back_populates="playlist_entries",
    )

    def __repr__(self) -> str:
        return (
            f"<PlaylistSong playlist_id={self.playlist_id} "
            f"song_id={self.song_id} position={self.position}>"
        )
