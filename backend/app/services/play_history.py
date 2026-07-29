"""Recently played / listening-time service."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.song import Song
from app.models.user import User
from app.repositories.play_history import PlayHistoryRepository
from app.repositories.user import UserRepository
from app.schemas.song import SongListResponse, SongResponse

# Guard against a single report inflating totals (e.g. tab left open, bad client).
MAX_REPORT_SECONDS = 600


class PlayHistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.history = PlayHistoryRepository(session)
        self.users = UserRepository(session)

    async def record(self, *, user_id: uuid.UUID, song_id: uuid.UUID) -> None:
        """Record that a play started. Listening time is reported separately."""
        await self.history.upsert(user_id=user_id, song_id=song_id)

    async def add_listening(
        self,
        *,
        user_id: uuid.UUID,
        song_id: uuid.UUID,
        seconds: int,
    ) -> int:
        """
        Add real seconds listened for a song.

        Clamped to the track duration per report so a client cannot
        report more time than the song actually lasts.
        """
        if seconds <= 0:
            return 0

        result = await self.session.execute(
            select(Song.duration_seconds).where(Song.id == song_id)
        )
        duration = result.scalar_one_or_none()
        if duration is None:
            return 0

        capped = min(seconds, MAX_REPORT_SECONDS, int(duration))
        if capped <= 0:
            return 0

        await self.history.add_listened_seconds(
            user_id=user_id,
            song_id=song_id,
            seconds=capped,
        )
        await self.users.add_listen_seconds(user_id, capped)
        return capped

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
