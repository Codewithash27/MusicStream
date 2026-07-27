"""Album ORM model."""

from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.artist import ArtistProfile
    from app.models.song import Song


class Album(BaseModel):
    """Collection of songs released by an artist."""

    __tablename__ = "albums"

    artist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    artist: Mapped[ArtistProfile] = relationship(
        "ArtistProfile",
        back_populates="albums",
    )
    songs: Mapped[list[Song]] = relationship(
        "Song",
        back_populates="album",
        # Keep songs when album is deleted; album_id is SET NULL via FK
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Album id={self.id} title={self.title!r}>"
