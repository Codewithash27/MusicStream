"""Artist profile data-access helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.artist import ArtistProfile
from app.models.user import User


class ArtistRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, artist_id: uuid.UUID) -> ArtistProfile | None:
        result = await self.session.execute(
            select(ArtistProfile).where(ArtistProfile.id == artist_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> ArtistProfile | None:
        result = await self.session.execute(
            select(ArtistProfile).where(ArtistProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_or_create_for_user(self, user: User) -> ArtistProfile:
        existing = await self.get_by_user_id(user.id)
        if existing:
            return existing
        profile = ArtistProfile(
            user_id=user.id,
            stage_name=user.display_name,
        )
        self.session.add(profile)
        await self.session.flush()
        await self.session.refresh(profile)
        return profile
