"""Like data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.like import Like
from app.models.song import Song


class LikeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, *, user_id: uuid.UUID, song_id: uuid.UUID) -> Like | None:
        result = await self.session.execute(
            select(Like).where(Like.user_id == user_id, Like.song_id == song_id)
        )
        return result.scalar_one_or_none()

    async def create(self, like: Like) -> Like:
        self.session.add(like)
        await self.session.flush()
        return like

    async def delete(self, *, user_id: uuid.UUID, song_id: uuid.UUID) -> bool:
        result = await self.session.execute(
            delete(Like).where(Like.user_id == user_id, Like.song_id == song_id)
        )
        await self.session.flush()
        return (result.rowcount or 0) > 0

    async def list_songs_for_user(
        self,
        *,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Song], int]:
        count_stmt = (
            select(func.count())
            .select_from(Like)
            .where(Like.user_id == user_id)
        )
        list_stmt = (
            select(Song)
            .join(Like, Like.song_id == Song.id)
            .options(selectinload(Song.artist))
            .where(Like.user_id == user_id)
            .order_by(Like.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        total = (await self.session.execute(count_stmt)).scalar_one()
        rows = (await self.session.execute(list_stmt)).scalars().all()
        return list(rows), total

    async def list_song_ids(self, *, user_id: uuid.UUID) -> list[uuid.UUID]:
        result = await self.session.execute(
            select(Like.song_id).where(Like.user_id == user_id)
        )
        return list(result.scalars().all())
