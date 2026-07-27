"""User data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
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
