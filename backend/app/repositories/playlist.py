"""Playlist data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.playlist import Playlist, PlaylistSong
from app.models.song import Song


class PlaylistRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, playlist_id: uuid.UUID) -> Playlist | None:
        result = await self.session.execute(
            select(Playlist)
            .options(
                selectinload(Playlist.owner),
                selectinload(Playlist.playlist_songs)
                .selectinload(PlaylistSong.song)
                .selectinload(Song.artist),
            )
            .where(Playlist.id == playlist_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        user_id: uuid.UUID | None = None,
        mine_only: bool = False,
        q: str | None = None,
    ) -> tuple[list[Playlist], int]:
        filters = []
        if mine_only and user_id is not None:
            filters.append(Playlist.user_id == user_id)
        elif user_id is not None:
            filters.append(
                or_(Playlist.is_public.is_(True), Playlist.user_id == user_id)
            )
        else:
            filters.append(Playlist.is_public.is_(True))

        if q:
            filters.append(Playlist.name.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(Playlist)
        list_stmt = (
            select(Playlist)
            .options(
                selectinload(Playlist.owner),
                selectinload(Playlist.playlist_songs),
            )
            .order_by(Playlist.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        for f in filters:
            count_stmt = count_stmt.where(f)
            list_stmt = list_stmt.where(f)

        total = (await self.session.execute(count_stmt)).scalar_one()
        rows = (await self.session.execute(list_stmt)).scalars().all()
        return list(rows), total

    async def create(self, playlist: Playlist) -> Playlist:
        self.session.add(playlist)
        await self.session.flush()
        await self.session.refresh(playlist)
        return await self.get_by_id(playlist.id)  # type: ignore[return-value]

    async def add_song(
        self,
        *,
        playlist_id: uuid.UUID,
        song_id: uuid.UUID,
        position: int,
    ) -> PlaylistSong:
        entry = PlaylistSong(
            playlist_id=playlist_id,
            song_id=song_id,
            position=position,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def max_position(self, playlist_id: uuid.UUID) -> int:
        result = await self.session.execute(
            select(func.coalesce(func.max(PlaylistSong.position), 0)).where(
                PlaylistSong.playlist_id == playlist_id
            )
        )
        return int(result.scalar_one())
