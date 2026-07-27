"""Like ORM model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.song import Song
    from app.models.user import User


class Like(BaseModel):
    """
    User like on a Song.

    Duplicate likes are prevented by a unique (user_id, song_id) constraint.
    """

    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "song_id", name="uq_likes_user_song"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    song_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped[User] = relationship(
        "User",
        back_populates="likes",
    )
    song: Mapped[Song] = relationship(
        "Song",
        back_populates="likes",
    )

    def __repr__(self) -> str:
        return f"<Like user_id={self.user_id} song_id={self.song_id}>"
