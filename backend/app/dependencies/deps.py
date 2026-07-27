"""Shared FastAPI dependencies."""

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.dependencies.auth import (
    AdminUser,
    ArtistUser,
    CurrentUser,
    get_current_active_user,
    get_current_user,
    require_roles,
)

__all__ = [
    "AdminUser",
    "ArtistUser",
    "CurrentUser",
    "Settings",
    "get_app_settings",
    "get_current_active_user",
    "get_current_user",
    "get_db",
    "require_roles",
]


def get_app_settings() -> Settings:
    """Provide application settings to route handlers."""
    return get_settings()
