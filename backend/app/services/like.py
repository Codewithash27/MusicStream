"""Like / unlike service."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.like import Like
from app.models.user import User
from app.repositories.like import LikeRepository
from app.repositories.song import SongRepository
from app.schemas.song import SongListResponse, SongResponse


class LikeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.likes = LikeRepository(session)
        self.songs = SongRepository(session)

    async def like(self, *, user: User, song_id: uuid.UUID) -> None:
        song = await self.songs.get_by_id(song_id)
        if song is None:
            raise NotFoundError("Song not found")
        existing = await self.likes.get(user_id=user.id, song_id=song_id)
        if existing is None:
            await self.likes.create(Like(user_id=user.id, song_id=song_id))
            await self.session.commit()

    async def unlike(self, *, user: User, song_id: uuid.UUID) -> None:
        deleted = await self.likes.delete(user_id=user.id, song_id=song_id)
        if not deleted:
            # Idempotent unlike — still 204 if already not liked
            song = await self.songs.get_by_id(song_id)
            if song is None:
                raise NotFoundError("Song not found")
        await self.session.commit()

    async def list_liked(
        self,
        *,
        user: User,
        skip: int = 0,
        limit: int = 20,
    ) -> SongListResponse:
        rows, total = await self.likes.list_songs_for_user(
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

    async def liked_ids(self, *, user: User) -> list[uuid.UUID]:
        return await self.likes.list_song_ids(user_id=user.id)
