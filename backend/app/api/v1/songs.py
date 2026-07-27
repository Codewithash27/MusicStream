"""Song REST API."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import ArtistUser
from app.schemas.song import SongListResponse, SongResponse, SongUpdate
from app.services.song import SongService

router = APIRouter(prefix="/songs", tags=["Songs"])


def get_song_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SongService:
    return SongService(session)


@router.post(
    "",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a song",
    description=(
        "Upload an MP3 (required) and optional cover image. "
        "Requires **ARTIST** or **ADMIN** role. "
        "An artist profile is created automatically if missing."
    ),
    responses={
        201: {"description": "Song created"},
        400: {"description": "Invalid file type or size"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not an artist/admin"},
    },
)
async def create_song(
    user: ArtistUser,
    service: Annotated[SongService, Depends(get_song_service)],
    title: Annotated[str, Form(min_length=1, max_length=255)],
    duration_seconds: Annotated[int, Form(ge=1, le=86_400)],
    audio: Annotated[UploadFile, File(description="MP3 audio file")],
    cover: Annotated[
        UploadFile | None,
        File(description="Cover image (JPEG/PNG/WebP)"),
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
    "/{song_id}/play",
    response_model=SongResponse,
    summary="Increment play count",
    description="Atomically increment the song play counter.",
    openapi_extra={"security": []},
    responses={404: {"description": "Song not found"}},
)
async def play_song(
    song_id: uuid.UUID,
    service: Annotated[SongService, Depends(get_song_service)],
) -> SongResponse:
    return await service.increment_play(song_id)
