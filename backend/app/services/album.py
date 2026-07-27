"""Album business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.album import AlbumRepository
from app.schemas.album import AlbumDetailResponse, AlbumListResponse, AlbumResponse
from app.schemas.song import ArtistBrief, SongResponse


class AlbumService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.albums = AlbumRepository(session)

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        artist_id: uuid.UUID | None = None,
        q: str | None = None,
    ) -> AlbumListResponse:
        items, total = await self.albums.list(
            skip=skip,
            limit=limit,
            artist_id=artist_id,
            q=q,
        )
        return AlbumListResponse(
            items=[self._to_response(a) for a in items],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get(self, album_id: uuid.UUID) -> AlbumDetailResponse:
        album = await self.albums.get_by_id(album_id)
        if album is None:
            raise NotFoundError("Album not found")
        base = self._to_response(album)
        songs = [
            SongResponse.model_validate(s)
            for s in sorted(album.songs, key=lambda x: (x.track_number or 999, x.created_at))
        ]
        return AlbumDetailResponse(**base.model_dump(), songs=songs)

    @staticmethod
    def _to_response(album) -> AlbumResponse:
        return AlbumResponse(
            id=album.id,
            artist_id=album.artist_id,
            title=album.title,
            description=album.description,
            cover_url=album.cover_url,
            release_date=album.release_date,
            created_at=album.created_at,
            updated_at=album.updated_at,
            artist=ArtistBrief.model_validate(album.artist) if album.artist else None,
            track_count=len(album.songs) if album.songs is not None else 0,
        )
