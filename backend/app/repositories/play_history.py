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
            row = PlayHistory(user_id=user_id, song_id=song_id, play_count=1)
            self.session.add(row)
        else:
            row.updated_at = now
            row.play_count = int(row.play_count or 0) + 1
        await self.session.flush()
        return row

    async def add_listened_seconds(
        self,
        *,
        user_id: uuid.UUID,
        song_id: uuid.UUID,
        seconds: int,
    ) -> None:
        """Accumulate real seconds listened for this (user, song) pair."""
        if seconds <= 0:
            return
        result = await self.session.execute(
            select(PlayHistory).where(
                PlayHistory.user_id == user_id,
                PlayHistory.song_id == song_id,
            )
        )
        row = result.scalar_one_or_none()
        if row is None:
            row = PlayHistory(
                user_id=user_id,
                song_id=song_id,
                play_count=1,
                listened_seconds=seconds,
            )
            self.session.add(row)
        else:
            row.listened_seconds = int(row.listened_seconds or 0) + seconds
            row.updated_at = datetime.now(timezone.utc)
        await self.session.flush()

    async def list_most_played_for_user(
        self,
        *,
        user_id: uuid.UUID,
        limit: int = 10,
    ) -> list[tuple[Song, int, int]]:
        stmt = (
            select(Song, PlayHistory.play_count, PlayHistory.listened_seconds)
            .join(PlayHistory, PlayHistory.song_id == Song.id)
            .options(selectinload(Song.artist))
            .where(PlayHistory.user_id == user_id)
            .order_by(
                PlayHistory.listened_seconds.desc(),
                PlayHistory.play_count.desc(),
                PlayHistory.updated_at.desc(),
            )
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return [
            (song, int(count), int(listened))
            for song, count, listened in result.all()
        ]

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
