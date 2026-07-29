"""Song REST API."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import ArtistUser, get_current_user
from app.models.user import User
from app.schemas.song import SongListResponse, SongResponse, SongUpdate
from app.services.play_history import PlayHistoryService
from app.services.song import SongService

router = APIRouter(prefix="/songs", tags=["Songs"])
optional_bearer = HTTPBearer(auto_error=False)


def get_song_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SongService:
    return SongService(session)


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(optional_bearer),
    ],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, session)
    except Exception:
        return None


@router.post(
    "",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a song",
    description=(
        "Upload an MP3 (**audio/mpeg**, max **25MB**) and optional cover "
        "(**JPEG/PNG/WebP**, max **5MB**). "
        "Files are stored securely in Supabase Storage; public URLs are saved in PostgreSQL. "
        "Requires **ARTIST** or **ADMIN**. Alias: `POST /songs/upload`."
    ),
    responses={
        201: {"description": "Song created"},
        400: {"description": "Invalid file type or size"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not an artist/admin"},
        502: {"description": "Storage upload failed"},
        503: {"description": "Storage unavailable"},
    },
)
async def create_song(
    user: ArtistUser,
    service: Annotated[SongService, Depends(get_song_service)],
    title: Annotated[str, Form(min_length=1, max_length=255)],
    duration_seconds: Annotated[int, Form(ge=1, le=86_400)],
    audio: Annotated[UploadFile, File(description="MP3 audio file (audio/mpeg, max 25MB)")],
    cover: Annotated[
        UploadFile | None,
        File(description="Cover image JPEG/PNG/WebP (max 5MB)"),
    ] = None,
    album_id: Annotated[uuid.UUID | None, Form()] = None,
    track_number: Annotated[int | None, Form(ge=1, le=999)] = None,
) -> SongResponse:
    return await service.create(
        user=user,
        title=title,
        duration_seconds=duration_seconds,
        audio=audio,
        cover=cover,
        album_id=album_id,
        track_number=track_number,
    )


@router.post(
    "/upload",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a song (alias)",
    description=(
        "Same as `POST /songs`. Uploads an MP3 (**audio/mpeg**, max **25MB**) "
        "and optional cover (**JPEG/PNG/WebP**, max **5MB**). "
        "Files are stored securely in Supabase Storage. "
        "Stores public URLs in PostgreSQL. Requires **ARTIST** or **ADMIN**."
    ),
    responses={
        201: {"description": "Song created with public audio/cover URLs"},
        400: {"description": "Invalid MIME type or file too large"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not an artist/admin"},
        502: {"description": "Storage upload failed"},
        503: {"description": "Storage unavailable"},
    },
)
async def upload_song(
    user: ArtistUser,
    service: Annotated[SongService, Depends(get_song_service)],
    title: Annotated[str, Form(min_length=1, max_length=255)],
    duration_seconds: Annotated[int, Form(ge=1, le=86_400)],
    audio: Annotated[UploadFile, File(description="MP3 audio file (audio/mpeg, max 25MB)")],
    cover: Annotated[
        UploadFile | None,
        File(description="Cover image JPEG/PNG/WebP (max 5MB)"),
    ] = None,
    album_id: Annotated[uuid.UUID | None, Form()] = None,
    track_number: Annotated[int | None, Form(ge=1, le=999)] = None,
) -> SongResponse:
    return await service.create(
        user=user,
        title=title,
        duration_seconds=duration_seconds,
        audio=audio,
        cover=cover,
        album_id=album_id,
        track_number=track_number,
    )


@router.get(
    "",
    response_model=SongListResponse,
    summary="List songs",
    description="Paginated song catalogue with optional filters.",
    openapi_extra={"security": []},
)
async def list_songs(
    service: Annotated[SongService, Depends(get_song_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    artist_id: Annotated[uuid.UUID | None, Query()] = None,
    album_id: Annotated[uuid.UUID | None, Query()] = None,
    q: Annotated[str | None, Query(max_length=100, description="Title search")] = None,
) -> SongListResponse:
    return await service.list(
        skip=skip,
        limit=limit,
        artist_id=artist_id,
        album_id=album_id,
        q=q,
    )


@router.get(
    "/{song_id}",
    response_model=SongResponse,
    summary="Get song by ID",
    openapi_extra={"security": []},
    responses={404: {"description": "Song not found"}},
)
async def get_song(
    song_id: uuid.UUID,
    service: Annotated[SongService, Depends(get_song_service)],
) -> SongResponse:
    return await service.get(song_id)


@router.patch(
    "/{song_id}",
    response_model=SongResponse,
    summary="Update song",
    description=(
        "Update metadata and/or replace audio/cover. "
        "Owner artist or ADMIN only. Multipart form."
    ),
    responses={
        404: {"description": "Song not found"},
        403: {"description": "Not the song owner"},
    },
)
async def update_song(
    song_id: uuid.UUID,
    user: ArtistUser,
    service: Annotated[SongService, Depends(get_song_service)],
    title: Annotated[str | None, Form(min_length=1, max_length=255)] = None,
    duration_seconds: Annotated[int | None, Form(ge=1, le=86_400)] = None,
    album_id: Annotated[uuid.UUID | None, Form()] = None,
    track_number: Annotated[int | None, Form(ge=1, le=999)] = None,
    clear_album: Annotated[bool, Form()] = False,
    clear_cover: Annotated[bool, Form()] = False,
    audio: Annotated[UploadFile | None, File()] = None,
    cover: Annotated[UploadFile | None, File()] = None,
) -> SongResponse:
    data = SongUpdate(
        title=title,
        duration_seconds=duration_seconds,
        album_id=album_id,
        track_number=track_number,
        clear_album=clear_album,
        clear_cover=clear_cover,
    )
    return await service.update(
        song_id=song_id,
        user=user,
        data=data,
        audio=audio,
        cover=cover,
    )


@router.delete(
    "/{song_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete song",
    description="Delete song metadata and stored files. Owner artist or ADMIN only.",
    responses={
        204: {"description": "Deleted"},
        404: {"description": "Song not found"},
        403: {"description": "Not the song owner"},
    },
)
async def delete_song(
    song_id: uuid.UUID,
    user: ArtistUser,
    service: Annotated[SongService, Depends(get_song_service)],
) -> Response:
    await service.delete(song_id=song_id, user=user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{song_id}/cover",
    response_model=SongResponse,
    summary="Upload or replace song cover",
    description=(
        "Upload a cover image for an existing song "
        "(**image/jpeg**, **image/png**, or **image/webp**, max **5MB**). "
        "Files are stored securely in Supabase Storage. "
        "Replaces any previous cover and updates `cover_url` in PostgreSQL. "
        "Owner artist or ADMIN only."
    ),
    responses={
        200: {"description": "Cover updated"},
        400: {"description": "Invalid MIME type or file too large"},
        403: {"description": "Not the song owner"},
        404: {"description": "Song not found"},
        502: {"description": "Storage upload failed"},
        503: {"description": "Storage unavailable"},
    },
)
async def upload_song_cover(
    song_id: uuid.UUID,
    user: ArtistUser,
    service: Annotated[SongService, Depends(get_song_service)],
    cover: Annotated[UploadFile, File(description="Cover image JPEG/PNG/WebP (max 5MB)")],
) -> SongResponse:
    return await service.set_cover(song_id=song_id, user=user, cover=cover)


@router.post(
    "/{song_id}/play",
    response_model=SongResponse,
    summary="Increment play count",
    description=(
        "Atomically increment the song play counter. "
        "When authenticated, also records the track in the user's recently played list."
    ),
    openapi_extra={"security": []},
    responses={404: {"description": "Song not found"}},
)
async def play_song(
    song_id: uuid.UUID,
    service: Annotated[SongService, Depends(get_song_service)],
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> SongResponse:
    song = await service.increment_play(song_id)
    if user is not None:
        await PlayHistoryService(session).record(user_id=user.id, song_id=song_id)
        await session.commit()
    return song
