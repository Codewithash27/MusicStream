"""User data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.song import Song
from app.models.user import User


class UserRepository:
    """Persistence operations for User."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.username == username.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_identifier(self, identifier: str) -> User | None:
        """Look up by email or username."""
        value = identifier.lower().strip()
        result = await self.session.execute(
            select(User).where(
                or_(User.email == value, User.username == value)
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        email: str,
        username: str,
        hashed_password: str,
        display_name: str,
        role: UserRole = UserRole.USER,
    ) -> User:
        user = User(
            email=email.lower(),
            username=username.lower(),
            hashed_password=hashed_password,
            display_name=display_name,
            role=role,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def list_users(
        self,
        *,
        q: str | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[User], int]:
        filters = []
        if q:
            term = f"%{q.strip().lower()}%"
            filters.append(
                or_(
                    func.lower(User.email).like(term),
                    func.lower(User.username).like(term),
                    func.lower(User.display_name).like(term),
                )
            )
        if is_active is not None:
            filters.append(User.is_active.is_(is_active))

        count_stmt = select(func.count()).select_from(User)
        list_stmt = select(User).order_by(User.created_at.desc())
        if filters:
            count_stmt = count_stmt.where(*filters)
            list_stmt = list_stmt.where(*filters)

        total = int((await self.session.execute(count_stmt)).scalar_one())
        result = await self.session.execute(list_stmt.offset(skip).limit(limit))
        return list(result.scalars().all()), total

    async def add_listen_seconds(self, user_id: uuid.UUID, seconds: int) -> None:
        if seconds <= 0:
            return
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(total_listen_seconds=User.total_listen_seconds + seconds)
        )

    async def admin_stats(self) -> dict[str, int]:
        total_users = int(
            (await self.session.execute(select(func.count()).select_from(User))).scalar_one()
        )
        active_users = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(User).where(User.is_active.is_(True))
                )
            ).scalar_one()
        )
        total_listen = int(
            (
                await self.session.execute(
                    select(func.coalesce(func.sum(User.total_listen_seconds), 0))
                )
            ).scalar_one()
        )
        total_plays = int(
            (
                await self.session.execute(
                    select(func.coalesce(func.sum(Song.play_count), 0))
                )
            ).scalar_one()
        )
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "total_listen_seconds": total_listen,
            "total_song_plays": total_plays,
        }
