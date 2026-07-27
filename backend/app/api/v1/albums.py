"""Album REST API."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.album import AlbumDetailResponse, AlbumListResponse
from app.services.album import AlbumService

router = APIRouter(prefix="/albums", tags=["Albums"])


def get_album_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AlbumService:
    return AlbumService(session)


@router.get(
    "",
    response_model=AlbumListResponse,
    summary="List albums",
    openapi_extra={"security": []},
)
async def list_albums(
    service: Annotated[AlbumService, Depends(get_album_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    artist_id: Annotated[uuid.UUID | None, Query()] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
) -> AlbumListResponse:
    return await service.list(skip=skip, limit=limit, artist_id=artist_id, q=q)


@router.get(
    "/{album_id}",
    response_model=AlbumDetailResponse,
    summary="Get album by ID",
    openapi_extra={"security": []},
    responses={404: {"description": "Album not found"}},
)
async def get_album(
    album_id: uuid.UUID,
    service: Annotated[AlbumService, Depends(get_album_service)],
) -> AlbumDetailResponse:
    return await service.get(album_id)
