"""User ORM model."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.artist import ArtistProfile
    from app.models.like import Like
    from app.models.play_history import PlayHistory
    from app.models.playlist import Playlist
    from app.models.refresh_token import RefreshToken


class User(BaseModel):
    """Registered MusicStream account."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        default=UserRole.USER,
        server_default=UserRole.USER.value,
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    # Relationships
    artist_profile: Mapped[Optional[ArtistProfile]] = relationship(
        "ArtistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    playlists: Mapped[list[Playlist]] = relationship(
        "Playlist",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    likes: Mapped[list[Like]] = relationship(
        "Like",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    play_history: Mapped[list[PlayHistory]] = relationship(
        "PlayHistory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"
