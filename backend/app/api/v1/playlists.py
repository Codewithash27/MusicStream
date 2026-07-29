"""Playlist REST API."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser, get_current_user
from app.models.user import User
from app.schemas.playlist import (
    AddSongToPlaylist,
    PlaylistCreate,
    PlaylistDetailResponse,
    PlaylistListResponse,
    PlaylistUpdate,
    ReorderPlaylist,
)
from app.services.playlist import PlaylistService

router = APIRouter(prefix="/playlists", tags=["Playlists"])
optional_bearer = HTTPBearer(auto_error=False)


def get_playlist_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PlaylistService:
    return PlaylistService(session)


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


@router.get(
    "",
    response_model=PlaylistListResponse,
    summary="List playlists",
    openapi_extra={"security": []},
)
async def list_playlists(
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
    user: Annotated[User | None, Depends(get_optional_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    mine: Annotated[bool, Query()] = False,
    q: Annotated[str | None, Query(max_length=100)] = None,
) -> PlaylistListResponse:
    return await service.list(skip=skip, limit=limit, user=user, mine=mine, q=q)


@router.post(
    "",
    response_model=PlaylistDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create playlist",
)
async def create_playlist(
    payload: PlaylistCreate,
    user: CurrentUser,
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
) -> PlaylistDetailResponse:
    return await service.create(user, payload)


@router.get(
    "/{playlist_id}",
    response_model=PlaylistDetailResponse,
    summary="Get playlist by ID",
    openapi_extra={"security": []},
)
async def get_playlist(
    playlist_id: uuid.UUID,
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> PlaylistDetailResponse:
    return await service.get(playlist_id, user)


@router.patch(
    "/{playlist_id}",
    response_model=PlaylistDetailResponse,
    summary="Update playlist",
)
async def update_playlist(
    playlist_id: uuid.UUID,
    payload: PlaylistUpdate,
    user: CurrentUser,
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
) -> PlaylistDetailResponse:
    return await service.update(playlist_id, user, payload)


@router.post(
    "/{playlist_id}/songs",
    response_model=PlaylistDetailResponse,
    summary="Add song to playlist",
)
async def add_song_to_playlist(
    playlist_id: uuid.UUID,
    payload: AddSongToPlaylist,
    user: CurrentUser,
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
) -> PlaylistDetailResponse:
    return await service.add_song(playlist_id, user, payload.song_id)


@router.delete(
    "/{playlist_id}/songs/{song_id}",
    response_model=PlaylistDetailResponse,
    summary="Remove song from playlist",
)
async def remove_song_from_playlist(
    playlist_id: uuid.UUID,
    song_id: uuid.UUID,
    user: CurrentUser,
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
) -> PlaylistDetailResponse:
    return await service.remove_song(playlist_id, user, song_id)


@router.put(
    "/{playlist_id}/reorder",
    response_model=PlaylistDetailResponse,
    summary="Reorder songs in playlist",
)
async def reorder_playlist(
    playlist_id: uuid.UUID,
    payload: ReorderPlaylist,
    user: CurrentUser,
    service: Annotated[PlaylistService, Depends(get_playlist_service)],
) -> PlaylistDetailResponse:
    return await service.reorder(playlist_id, user, payload.song_ids)
