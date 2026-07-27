"""Authentication business logic."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    UnauthorizedError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.auth import (
    AuthResponse,
    TokenPair,
    UserLogin,
    UserRegister,
)
from app.schemas.user import UserPublic


class AuthService:
    """Register, login, refresh, and logout flows."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.refresh_tokens = RefreshTokenRepository(session)
        self.settings = get_settings()

    async def register(self, payload: UserRegister) -> AuthResponse:
        if await self.users.get_by_email(payload.email):
            raise ConflictError("Email is already registered")
        if await self.users.get_by_username(payload.username):
            raise ConflictError("Username is already taken")

        user = await self.users.create(
            email=payload.email,
            username=payload.username,
            hashed_password=hash_password(payload.password),
            display_name=payload.display_name,
            role=UserRole(payload.role),
        )
        tokens = await self._issue_token_pair(user)
        await self.session.commit()
        await self.session.refresh(user)
        return AuthResponse(user=UserPublic.model_validate(user), tokens=tokens)

    async def login(self, payload: UserLogin) -> AuthResponse:
        user = await self.users.get_by_identifier(payload.identifier)
        if user is None or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials")
        if not user.is_active:
            raise UnauthorizedError("Account is inactive")

        tokens = await self._issue_token_pair(user)
        await self.session.commit()
        return AuthResponse(user=UserPublic.model_validate(user), tokens=tokens)

    async def refresh(self, refresh_token: str) -> AuthResponse:
        payload = self._decode_refresh_payload(refresh_token)
        jti = payload["jti"]
        user_id = uuid.UUID(payload["sub"])

        stored = await self.refresh_tokens.get_by_jti(jti)
        if stored is None or stored.is_revoked:
            raise UnauthorizedError("Refresh token is invalid or revoked")
        if stored.expires_at.tzinfo is None:
            expires_at = stored.expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at = stored.expires_at
        if expires_at < datetime.now(timezone.utc):
            raise UnauthorizedError("Refresh token has expired")
        if stored.user_id != user_id:
            raise UnauthorizedError("Refresh token is invalid")

        user = await self.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("User not found or inactive")

        # Rotate: revoke old refresh token, issue a new pair
        await self.refresh_tokens.revoke(stored)
        tokens = await self._issue_token_pair(user)
        await self.session.commit()
        return AuthResponse(user=UserPublic.model_validate(user), tokens=tokens)

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = self._decode_refresh_payload(refresh_token)
        except UnauthorizedError:
            # Idempotent logout — treat bad tokens as already logged out
            return

        stored = await self.refresh_tokens.get_by_jti(payload["jti"])
        if stored and not stored.is_revoked:
            await self.refresh_tokens.revoke(stored)
            await self.session.commit()

    async def logout_all(self, user_id: uuid.UUID) -> None:
        await self.refresh_tokens.revoke_all_for_user(user_id)
        await self.session.commit()

    async def _issue_token_pair(self, user: User) -> TokenPair:
        access, _, _ = create_access_token(
            subject=str(user.id),
            role=user.role.value,
        )
        refresh, refresh_jti, refresh_exp = create_refresh_token(
            subject=str(user.id),
            role=user.role.value,
        )
        await self.refresh_tokens.create(
            user_id=user.id,
            jti=refresh_jti,
            expires_at=refresh_exp,
        )
        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            token_type="bearer",
            expires_in=self.settings.jwt_access_token_expire_minutes * 60,
        )

    @staticmethod
    def _decode_refresh_payload(token: str) -> dict:
        try:
            payload = decode_token(token)
        except JWTError as exc:
            raise UnauthorizedError("Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise BadRequestError("Token is not a refresh token")
        if not payload.get("sub") or not payload.get("jti"):
            raise UnauthorizedError("Invalid refresh token payload")
        return payload
