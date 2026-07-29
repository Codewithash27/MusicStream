"""Play history ORM model (recently played)."""

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


class PlayHistory(BaseModel):
    """
    Per-user recently played song.

    One row per (user, song); ``updated_at`` is refreshed on each play.
    """

    __tablename__ = "play_history"
    __table_args__ = (
        UniqueConstraint("user_id", "song_id", name="uq_play_history_user_song"),
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

    user: Mapped[User] = relationship("User", back_populates="play_history")
    song: Mapped[Song] = relationship("Song", back_populates="play_history")

    def __repr__(self) -> str:
        return f"<PlayHistory user_id={self.user_id} song_id={self.song_id}>"
