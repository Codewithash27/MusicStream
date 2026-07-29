"""Admin REST API (ADMIN role only)."""

from __future__ import annotations

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import AdminUser
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserDetailResponse,
    AdminUserListResponse,
    AdminUserOut,
    AdminUserUpdate,
)
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_admin_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminService:
    return AdminService(session)


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Platform overview stats",
    responses={403: {"description": "Admin only"}},
)
async def admin_stats(
    _: AdminUser,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> AdminStatsResponse:
    return await service.stats()


@router.get(
    "/users",
    response_model=AdminUserListResponse,
    summary="List users",
    responses={403: {"description": "Admin only"}},
)
async def list_users(
    _: AdminUser,
    service: Annotated[AdminService, Depends(get_admin_service)],
    q: Annotated[str | None, Query(max_length=100)] = None,
    is_active: Annotated[bool | None, Query()] = None,
    has_listened: Annotated[bool | None, Query()] = None,
    sort_by: Annotated[Literal["created_at", "listen_time"], Query()] = "created_at",
    sort_dir: Annotated[Literal["asc", "desc"], Query()] = "desc",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> AdminUserListResponse:
    return await service.list_users(
        q=q,
        is_active=is_active,
        has_listened=has_listened,
        sort_by=sort_by,
        sort_dir=sort_dir,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserDetailResponse,
    summary="User profile + most played songs",
    responses={
        403: {"description": "Admin only"},
        404: {"description": "User not found"},
    },
)
async def get_user(
    user_id: uuid.UUID,
    _: AdminUser,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> AdminUserDetailResponse:
    return await service.get_user(user_id)


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserOut,
    status_code=status.HTTP_200_OK,
    summary="Activate or deactivate a user",
    responses={
        400: {"description": "Invalid update (e.g. self-deactivate)"},
        403: {"description": "Admin only"},
        404: {"description": "User not found"},
    },
)
async def update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    admin: AdminUser,
    service: Annotated[AdminService, Depends(get_admin_service)],
) -> AdminUserOut:
    return await service.update_user(admin=admin, user_id=user_id, payload=payload)
