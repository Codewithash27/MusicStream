"""Likes and recently-played REST API."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.song import SongListResponse
from app.services.like import LikeService
from app.services.play_history import PlayHistoryService

router = APIRouter(tags=["Library"])


class LikedIdsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    song_ids: list[uuid.UUID]


class ListeningReport(BaseModel):
    """Real seconds listened since the previous report."""

    song_id: uuid.UUID
    seconds: int = Field(..., ge=1, le=600)


class ListeningReportResponse(BaseModel):
    recorded_seconds: int


def get_like_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LikeService:
    return LikeService(session)


def get_play_history_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PlayHistoryService:
    return PlayHistoryService(session)


@router.get(
    "/likes",
    response_model=SongListResponse,
    summary="List liked songs",
)
async def list_liked_songs(
    user: CurrentUser,
    service: Annotated[LikeService, Depends(get_like_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> SongListResponse:
    return await service.list_liked(user=user, skip=skip, limit=limit)


@router.get(
    "/likes/ids",
    response_model=LikedIdsResponse,
    summary="List liked song IDs",
)
async def list_liked_ids(
    user: CurrentUser,
    service: Annotated[LikeService, Depends(get_like_service)],
) -> LikedIdsResponse:
    ids = await service.liked_ids(user=user)
    return LikedIdsResponse(song_ids=ids)


@router.post(
    "/songs/{song_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Like a song",
)
async def like_song(
    song_id: uuid.UUID,
    user: CurrentUser,
    service: Annotated[LikeService, Depends(get_like_service)],
) -> Response:
    await service.like(user=user, song_id=song_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/songs/{song_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Unlike a song",
)
async def unlike_song(
    song_id: uuid.UUID,
    user: CurrentUser,
    service: Annotated[LikeService, Depends(get_like_service)],
) -> Response:
    await service.unlike(user=user, song_id=song_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/me/listening",
    response_model=ListeningReportResponse,
    summary="Report seconds actually listened",
    description=(
        "Adds real listening time for the current user. The player reports "
        "elapsed audio time periodically, so partial listens are counted "
        "accurately instead of crediting the whole track on play."
    ),
)
async def report_listening(
    payload: ListeningReport,
    user: CurrentUser,
    service: Annotated[PlayHistoryService, Depends(get_play_history_service)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ListeningReportResponse:
    recorded = await service.add_listening(
        user_id=user.id,
        song_id=payload.song_id,
        seconds=payload.seconds,
    )
    await session.commit()
    return ListeningReportResponse(recorded_seconds=recorded)


@router.get(
    "/me/recently-played",
    response_model=SongListResponse,
    summary="Recently played songs",
)
async def list_recently_played(
    user: CurrentUser,
    service: Annotated[PlayHistoryService, Depends(get_play_history_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> SongListResponse:
    return await service.list_recent(user=user, skip=skip, limit=limit)
