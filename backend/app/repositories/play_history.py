"""Play history data-access helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.play_history import PlayHistory
from app.models.song import Song


class PlayHistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert(self, *, user_id: uuid.UUID, song_id: uuid.UUID) -> PlayHistory:
        result = await self.session.execute(
            select(PlayHistory).where(
                PlayHistory.user_id == user_id,
                PlayHistory.song_id == song_id,
            )
        )
        row = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if row is None:
            row = PlayHistory(user_id=user_id, song_id=song_id)
            self.session.add(row)
        else:
            row.updated_at = now
        await self.session.flush()
        return row

    async def list_songs_for_user(
        self,
        *,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Song], int]:
        count_stmt = (
            select(func.count())
            .select_from(PlayHistory)
            .where(PlayHistory.user_id == user_id)
        )
        list_stmt = (
            select(Song)
            .join(PlayHistory, PlayHistory.song_id == Song.id)
            .options(selectinload(Song.artist))
            .where(PlayHistory.user_id == user_id)
            .order_by(PlayHistory.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        total = (await self.session.execute(count_stmt)).scalar_one()
        rows = (await self.session.execute(list_stmt)).scalars().all()
        return list(rows), total
