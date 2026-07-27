"""Authentication & authorization dependencies."""

from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Resolve the authenticated user from a Bearer access token."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Not authenticated")

    try:
        payload = decode_token(credentials.credentials)
    except JWTError as exc:
        raise UnauthorizedError("Could not validate credentials") from exc

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError("Could not validate credentials")

    try:
        user_id = uuid.UUID(subject)
    except ValueError as exc:
        raise UnauthorizedError("Could not validate credentials") from exc

    user = await UserRepository(session).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found")
    if not user.is_active:
        raise UnauthorizedError("Account is inactive")

    return user


async def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Alias for get_current_user (already checks is_active)."""
    return user


def require_roles(*roles: UserRole) -> Callable:
    """
    Dependency factory that enforces one of the given roles.

    Example::

        @router.get("/admin")
        async def admin_only(user: User = Depends(require_roles(UserRole.ADMIN))):
            ...
    """

    allowed = set(roles)

    async def _dependency(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role not in allowed:
            raise ForbiddenError(
                f"Requires one of roles: {', '.join(r.value for r in allowed)}"
            )
        return user

    return _dependency


# Convenience typed aliases for route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
ArtistUser = Annotated[
    User,
    Depends(require_roles(UserRole.ARTIST, UserRole.ADMIN)),
]
