"""Authentication API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.auth import (
    AuthResponse,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    UserLogin,
    UserRegister,
)
from app.schemas.user import UserPublic
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AuthService:
    return AuthService(session)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account",
    description=(
        "Create a MusicStream account. "
        "Role may be `USER` or `ARTIST` (`ADMIN` cannot self-register). "
        "Returns the user profile plus access and refresh tokens."
    ),
    responses={
        201: {"description": "Account created"},
        409: {"description": "Email or username already exists"},
        422: {"description": "Validation error"},
    },
    openapi_extra={"security": []},
)
async def register(
    payload: UserRegister,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    return await auth.register(payload)


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Login",
    description="Authenticate with email **or** username and password.",
    responses={
        200: {"description": "Authenticated"},
        401: {"description": "Invalid credentials or inactive account"},
        422: {"description": "Validation error"},
    },
    openapi_extra={"security": []},
)
async def login(
    payload: UserLogin,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    return await auth.login(payload)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh tokens",
    description=(
        "Exchange a valid refresh token for a new access + refresh pair. "
        "The previous refresh token is revoked (rotation)."
    ),
    responses={
        200: {"description": "Tokens rotated"},
        400: {"description": "Not a refresh token"},
        401: {"description": "Invalid, expired, or revoked refresh token"},
    },
    openapi_extra={"security": []},
)
async def refresh(
    payload: RefreshRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    return await auth.refresh(payload.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout",
    description=(
        "Revoke the provided refresh token so it can no longer mint access tokens. "
        "Idempotent: invalid tokens still return success."
    ),
    responses={
        200: {"description": "Logged out"},
    },
    openapi_extra={"security": []},
)
async def logout(
    payload: LogoutRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    await auth.logout(payload.refresh_token)
    return MessageResponse(message="Successfully logged out")


@router.get(
    "/me",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    summary="Current user",
    description="Return the profile of the authenticated user (Bearer access token).",
    responses={
        200: {"description": "Current user profile"},
        401: {"description": "Missing or invalid access token"},
    },
)
async def me(current_user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(current_user)
