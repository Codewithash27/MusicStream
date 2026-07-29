"""Recently played service."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.song import Song
from app.models.user import User
from app.repositories.play_history import PlayHistoryRepository
from app.repositories.user import UserRepository
from app.schemas.song import SongListResponse, SongResponse


class PlayHistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.history = PlayHistoryRepository(session)
        self.users = UserRepository(session)

    async def record(self, *, user_id: uuid.UUID, song_id: uuid.UUID) -> None:
        await self.history.upsert(user_id=user_id, song_id=song_id)
        result = await self.session.execute(
            select(Song.duration_seconds).where(Song.id == song_id)
        )
        duration = result.scalar_one_or_none()
        if duration:
            await self.users.add_listen_seconds(user_id, int(duration))

    async def list_recent(
        self,
        *,
        user: User,
        skip: int = 0,
        limit: int = 20,
    ) -> SongListResponse:
        rows, total = await self.history.list_songs_for_user(
            user_id=user.id,
            skip=skip,
            limit=limit,
        )
        return SongListResponse(
            items=[SongResponse.model_validate(s) for s in rows],
            total=total,
            skip=skip,
            limit=limit,
        )
