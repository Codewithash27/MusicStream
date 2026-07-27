"""Album data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.album import Album
from app.models.song import Song


class AlbumRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, album_id: uuid.UUID) -> Album | None:
        result = await self.session.execute(
            select(Album)
            .options(
                selectinload(Album.artist),
                selectinload(Album.songs).selectinload(Song.artist),
            )
            .where(Album.id == album_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        artist_id: uuid.UUID | None = None,
        q: str | None = None,
    ) -> tuple[list[Album], int]:
        filters = []
        if artist_id is not None:
            filters.append(Album.artist_id == artist_id)
        if q:
            filters.append(Album.title.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(Album)
        list_stmt = (
            select(Album)
            .options(selectinload(Album.artist), selectinload(Album.songs))
            .order_by(Album.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        for f in filters:
            count_stmt = count_stmt.where(f)
            list_stmt = list_stmt.where(f)

        total = (await self.session.execute(count_stmt)).scalar_one()
        rows = (await self.session.execute(list_stmt)).scalars().all()
        return list(rows), total
