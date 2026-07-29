"""Play history ORM model (recently played)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.song import Song
    from app.models.user import User


class PlayHistory(BaseModel):
    """
    Per-user recently / most-played song.

    One row per (user, song); ``updated_at`` and ``play_count`` refresh on each play.
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
    play_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False,
    )
    listened_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    user: Mapped[User] = relationship("User", back_populates="play_history")
    song: Mapped[Song] = relationship("Song", back_populates="play_history")

    def __repr__(self) -> str:
        return f"<PlayHistory user_id={self.user_id} song_id={self.song_id}>"
