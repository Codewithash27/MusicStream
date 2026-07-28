"""User profile endpoints (avatar upload)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.user import UserPublic
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["Users"])


def get_user_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserService:
    return UserService(session)


@router.post(
    "/avatar",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    summary="Upload user avatar",
    description=(
        "Upload a profile avatar (**image/jpeg**, **image/png**, or **image/webp**, "
        "max **5MB**). Files are stored securely in Supabase Storage. "
        "Stores the public URL in PostgreSQL (`users.avatar_url`) and "
        "replaces any previous avatar object. Requires authentication."
    ),
    responses={
        200: {"description": "Avatar uploaded; returns updated user"},
        400: {"description": "Invalid MIME type or file too large"},
        401: {"description": "Not authenticated"},
        502: {"description": "Storage upload failed"},
        503: {"description": "Storage unavailable"},
    },
)
async def upload_avatar(
    user: CurrentUser,
    service: Annotated[UserService, Depends(get_user_service)],
    avatar: Annotated[UploadFile, File(description="Avatar image JPEG/PNG/WebP (max 5MB)")],
) -> UserPublic:
    return await service.upload_avatar(user=user, avatar=avatar)


@router.delete(
    "/avatar",
    response_model=UserPublic,
    summary="Remove user avatar",
    description="Deletes the avatar object from storage and clears `avatar_url` in PostgreSQL.",
    responses={
        200: {"description": "Avatar removed"},
        401: {"description": "Not authenticated"},
    },
)
async def delete_avatar(
    user: CurrentUser,
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserPublic:
    return await service.clear_avatar(user=user)
