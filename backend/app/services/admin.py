"""Admin panel business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.user import User
from app.repositories.play_history import PlayHistoryRepository
from app.repositories.user import UserRepository
from app.schemas.admin import (
    AdminMostPlayedSong,
    AdminStatsResponse,
    AdminUserDetailResponse,
    AdminUserListResponse,
    AdminUserOut,
    AdminUserUpdate,
)
from app.schemas.song import SongResponse


class AdminService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.history = PlayHistoryRepository(session)

    async def stats(self) -> AdminStatsResponse:
        data = await self.users.admin_stats()
        return AdminStatsResponse(**data)

    async def list_users(
        self,
        *,
        q: str | None = None,
        is_active: bool | None = None,
        has_listened: bool | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        skip: int = 0,
        limit: int = 50,
    ) -> AdminUserListResponse:
        if sort_by not in {"created_at", "listen_time"}:
            raise BadRequestError("sort_by must be created_at or listen_time")
        if sort_dir not in {"asc", "desc"}:
            raise BadRequestError("sort_dir must be asc or desc")

        rows, total = await self.users.list_users(
            q=q,
            is_active=is_active,
            has_listened=has_listened,
            sort_by=sort_by,
            sort_dir=sort_dir,
            skip=skip,
            limit=limit,
        )
        return AdminUserListResponse(
            items=[AdminUserOut.model_validate(u) for u in rows],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_user(self, user_id: uuid.UUID) -> AdminUserDetailResponse:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")

        rows = await self.history.list_most_played_for_user(
            user_id=user.id,
            limit=10,
        )
        return AdminUserDetailResponse(
            user=AdminUserOut.model_validate(user),
            most_played=[
                AdminMostPlayedSong(
                    song=SongResponse.model_validate(song),
                    play_count=count,
                    listened_seconds=listened,
                )
                for song, count, listened in rows
            ],
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
