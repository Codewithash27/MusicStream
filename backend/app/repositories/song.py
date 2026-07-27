"""Song data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.song import Song


class SongRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, song_id: uuid.UUID) -> Song | None:
        result = await self.session.execute(
            select(Song)
            .options(selectinload(Song.artist))
            .where(Song.id == song_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        artist_id: uuid.UUID | None = None,
        album_id: uuid.UUID | None = None,
        q: str | None = None,
    ) -> tuple[list[Song], int]:
        filters = []
        if artist_id is not None:
            filters.append(Song.artist_id == artist_id)
        if album_id is not None:
            filters.append(Song.album_id == album_id)
        if q:
            filters.append(Song.title.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(Song)
        list_stmt = (
            select(Song)
            .options(selectinload(Song.artist))
            .order_by(Song.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        for f in filters:
            count_stmt = count_stmt.where(f)
            list_stmt = list_stmt.where(f)

        total = (await self.session.execute(count_stmt)).scalar_one()
        rows = (await self.session.execute(list_stmt)).scalars().all()
        return list(rows), total

    async def create(self, song: Song) -> Song:
        self.session.add(song)
        await self.session.flush()
        await self.session.refresh(song, attribute_names=["id", "created_at", "updated_at"])
        # Reload with artist relationship
        return await self.get_by_id(song.id)  # type: ignore[return-value]

    async def delete(self, song: Song) -> None:
        await self.session.delete(song)
        await self.session.flush()

    async def increment_play_count(self, song_id: uuid.UUID) -> Song | None:
        await self.session.execute(
            update(Song)
            .where(Song.id == song_id)
            .values(play_count=Song.play_count + 1)
        )
        await self.session.flush()
        return await self.get_by_id(song_id)
