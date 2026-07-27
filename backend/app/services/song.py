"""Song business logic: upload, CRUD, play count."""

from __future__ import annotations

import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.models.song import Song
from app.models.user import User
from app.repositories.artist import ArtistRepository
from app.repositories.song import SongRepository
from app.schemas.song import SongListResponse, SongResponse, SongUpdate
from app.services.storage import StorageBackend, get_storage, key_from_public_url
from app.utils.files import read_and_validate_audio, read_and_validate_cover


class SongService:
    def __init__(
        self,
        session: AsyncSession,
        storage: StorageBackend | None = None,
    ) -> None:
        self.session = session
        self.songs = SongRepository(session)
        self.artists = ArtistRepository(session)
        self.storage = storage or get_storage()
        self.settings = get_settings()

    async def create(
        self,
        *,
        user: User,
        title: str,
        duration_seconds: int,
        audio: UploadFile,
        cover: UploadFile | None = None,
        album_id: uuid.UUID | None = None,
        track_number: int | None = None,
    ) -> SongResponse:
        artist = await self.artists.get_or_create_for_user(user)

        audio_file = await read_and_validate_audio(
            audio,
            max_bytes=self.settings.max_audio_upload_bytes,
        )
        cover_file = None
        if cover is not None and cover.filename:
            cover_file = await read_and_validate_cover(
                cover,
                max_bytes=self.settings.max_cover_upload_bytes,
            )

        song_id = uuid.uuid4()
        audio_key = f"songs/{artist.id}/{song_id}/audio{audio_file.extension}"
        audio_url = await self.storage.upload(
            key=audio_key,
            content=audio_file.content,
            content_type=audio_file.content_type,
        )

        cover_url = None
        if cover_file:
            cover_key = f"songs/{artist.id}/{song_id}/cover{cover_file.extension}"
            cover_url = await self.storage.upload(
                key=cover_key,
                content=cover_file.content,
                content_type=cover_file.content_type,
            )

        song = Song(
            id=song_id,
            artist_id=artist.id,
            album_id=album_id,
            title=title.strip(),
            duration_seconds=duration_seconds,
            audio_url=audio_url,
            cover_url=cover_url,
            track_number=track_number,
        )
        created = await self.songs.create(song)
        await self.session.commit()
        return SongResponse.model_validate(created)

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        artist_id: uuid.UUID | None = None,
        album_id: uuid.UUID | None = None,
        q: str | None = None,
    ) -> SongListResponse:
        items, total = await self.songs.list(
            skip=skip,
            limit=limit,
            artist_id=artist_id,
            album_id=album_id,
            q=q,
        )
        return SongListResponse(
            items=[SongResponse.model_validate(s) for s in items],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get(self, song_id: uuid.UUID) -> SongResponse:
        song = await self.songs.get_by_id(song_id)
        if song is None:
            raise NotFoundError("Song not found")
        return SongResponse.model_validate(song)

    async def update(
        self,
        *,
        song_id: uuid.UUID,
        user: User,
        data: SongUpdate,
        audio: UploadFile | None = None,
        cover: UploadFile | None = None,
    ) -> SongResponse:
        song = await self._get_owned_song(song_id, user)

        if data.title is not None:
            song.title = data.title.strip()
        if data.duration_seconds is not None:
            song.duration_seconds = data.duration_seconds
        if data.track_number is not None:
            song.track_number = data.track_number
        if data.clear_album:
            song.album_id = None
        elif data.album_id is not None:
            song.album_id = data.album_id

        if audio is not None and audio.filename:
            audio_file = await read_and_validate_audio(
                audio,
                max_bytes=self.settings.max_audio_upload_bytes,
            )
            await self._delete_object_url(song.audio_url)
            key = f"songs/{song.artist_id}/{song.id}/audio{audio_file.extension}"
            song.audio_url = await self.storage.upload(
                key=key,
                content=audio_file.content,
                content_type=audio_file.content_type,
            )

        if data.clear_cover:
            await self._delete_object_url(song.cover_url)
            song.cover_url = None
        elif cover is not None and cover.filename:
            cover_file = await read_and_validate_cover(
                cover,
                max_bytes=self.settings.max_cover_upload_bytes,
            )
            await self._delete_object_url(song.cover_url)
            key = f"songs/{song.artist_id}/{song.id}/cover{cover_file.extension}"
            song.cover_url = await self.storage.upload(
                key=key,
                content=cover_file.content,
                content_type=cover_file.content_type,
            )

        await self.session.flush()
        await self.session.commit()
        refreshed = await self.songs.get_by_id(song.id)
        return SongResponse.model_validate(refreshed)

    async def delete(self, *, song_id: uuid.UUID, user: User) -> None:
        song = await self._get_owned_song(song_id, user)
        await self._delete_object_url(song.audio_url)
        await self._delete_object_url(song.cover_url)
        await self.songs.delete(song)
        await self.session.commit()

    async def increment_play(self, song_id: uuid.UUID) -> SongResponse:
        song = await self.songs.increment_play_count(song_id)
        if song is None:
            raise NotFoundError("Song not found")
        await self.session.commit()
        return SongResponse.model_validate(song)

    async def _get_owned_song(self, song_id: uuid.UUID, user: User) -> Song:
        song = await self.songs.get_by_id(song_id)
        if song is None:
            raise NotFoundError("Song not found")
        if user.role == UserRole.ADMIN:
            return song
        profile = await self.artists.get_by_user_id(user.id)
        if profile is None or song.artist_id != profile.id:
            raise ForbiddenError("You can only modify your own songs")
        return song

    async def _delete_object_url(self, url: str | None) -> None:
        if not url:
            return
        key = key_from_public_url(url, self.settings)
        if key:
            await self.storage.delete(key)
