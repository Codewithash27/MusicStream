"""ArtistProfile ORM model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.album import Album
    from app.models.song import Song
    from app.models.user import User


class ArtistProfile(BaseModel):
    """Public artist identity linked 1:1 to a User."""

    __tablename__ = "artist_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    stage_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    # Relationships
    user: Mapped[User] = relationship(
        "User",
        back_populates="artist_profile",
    )
    albums: Mapped[list[Album]] = relationship(
        "Album",
        back_populates="artist",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    songs: Mapped[list[Song]] = relationship(
        "Song",
        back_populates="artist",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<ArtistProfile id={self.id} stage_name={self.stage_name!r}>"
