"""Admin panel business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserListResponse,
    AdminUserOut,
    AdminUserUpdate,
)


class AdminService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)

    async def stats(self) -> AdminStatsResponse:
        data = await self.users.admin_stats()
        return AdminStatsResponse(**data)

    async def list_users(
        self,
        *,
        q: str | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> AdminUserListResponse:
        rows, total = await self.users.list_users(
            q=q,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )
        return AdminUserListResponse(
            items=[AdminUserOut.model_validate(u) for u in rows],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_user(
        self,
        *,
        admin: User,
        user_id: uuid.UUID,
        payload: AdminUserUpdate,
    ) -> AdminUserOut:
        if payload.is_active is None:
            raise BadRequestError("No fields to update")

        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")

        if user.id == admin.id and payload.is_active is False:
            raise BadRequestError("You cannot deactivate your own account")

        user.is_active = payload.is_active
        await self.session.commit()
        await self.session.refresh(user)
        return AdminUserOut.model_validate(user)
