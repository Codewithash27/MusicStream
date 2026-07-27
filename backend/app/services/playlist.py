"""Playlist business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.playlist import Playlist
from app.models.user import User
from app.repositories.playlist import PlaylistRepository
from app.repositories.song import SongRepository
from app.schemas.playlist import (
    PlaylistCreate,
    PlaylistDetailResponse,
    PlaylistListResponse,
    PlaylistOwnerBrief,
    PlaylistResponse,
    PlaylistUpdate,
)
from app.schemas.song import SongResponse


class PlaylistService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.playlists = PlaylistRepository(session)
        self.songs = SongRepository(session)

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        user: User | None = None,
        mine: bool = False,
        q: str | None = None,
    ) -> PlaylistListResponse:
        if mine and user is None:
            raise ForbiddenError("Authentication required")
        items, total = await self.playlists.list(
            skip=skip,
            limit=limit,
            user_id=user.id if user else None,
            mine_only=mine,
            q=q,
        )
        return PlaylistListResponse(
            items=[self._to_response(p) for p in items],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get(self, playlist_id: uuid.UUID, user: User | None = None) -> PlaylistDetailResponse:
        playlist = await self.playlists.get_by_id(playlist_id)
        if playlist is None:
            raise NotFoundError("Playlist not found")
        if not playlist.is_public and (user is None or playlist.user_id != user.id):
            raise ForbiddenError("This playlist is private")
        base = self._to_response(playlist)
        songs = [
            SongResponse.model_validate(entry.song)
            for entry in playlist.playlist_songs
            if entry.song is not None
        ]
        return PlaylistDetailResponse(**base.model_dump(), songs=songs)

    async def create(self, user: User, payload: PlaylistCreate) -> PlaylistDetailResponse:
        playlist = Playlist(
            user_id=user.id,
            name=payload.name.strip(),
            description=payload.description,
            cover_url=payload.cover_url,
            is_public=payload.is_public,
        )
        created = await self.playlists.create(playlist)
        await self.session.commit()
        return await self.get(created.id, user)

    async def update(
        self,
        playlist_id: uuid.UUID,
        user: User,
        payload: PlaylistUpdate,
    ) -> PlaylistDetailResponse:
        playlist = await self._owned(playlist_id, user)
        if payload.name is not None:
            playlist.name = payload.name.strip()
        if payload.description is not None:
            playlist.description = payload.description
        if payload.cover_url is not None:
            playlist.cover_url = payload.cover_url
        if payload.is_public is not None:
            playlist.is_public = payload.is_public
        await self.session.flush()
        await self.session.commit()
        return await self.get(playlist_id, user)

    async def add_song(
        self,
        playlist_id: uuid.UUID,
        user: User,
        song_id: uuid.UUID,
    ) -> PlaylistDetailResponse:
        playlist = await self._owned(playlist_id, user)
        song = await self.songs.get_by_id(song_id)
        if song is None:
            raise NotFoundError("Song not found")
        if any(e.song_id == song_id for e in playlist.playlist_songs):
            raise BadRequestError("Song already in playlist")
        position = (await self.playlists.max_position(playlist_id)) + 1
        await self.playlists.add_song(
            playlist_id=playlist_id,
            song_id=song_id,
            position=position,
        )
        await self.session.commit()
        return await self.get(playlist_id, user)

    async def _owned(self, playlist_id: uuid.UUID, user: User) -> Playlist:
        playlist = await self.playlists.get_by_id(playlist_id)
        if playlist is None:
            raise NotFoundError("Playlist not found")
        if playlist.user_id != user.id:
            raise ForbiddenError("You can only modify your own playlists")
        return playlist

    @staticmethod
    def _to_response(playlist: Playlist) -> PlaylistResponse:
        return PlaylistResponse(
            id=playlist.id,
            user_id=playlist.user_id,
            name=playlist.name,
            description=playlist.description,
            cover_url=playlist.cover_url,
            is_public=playlist.is_public,
            created_at=playlist.created_at,
            updated_at=playlist.updated_at,
            song_count=len(playlist.playlist_songs) if playlist.playlist_songs is not None else 0,
            owner=PlaylistOwnerBrief.model_validate(playlist.owner)
            if playlist.owner
            else None,
        )
