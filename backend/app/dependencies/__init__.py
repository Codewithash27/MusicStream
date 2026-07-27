"""Dependencies package."""

from app.dependencies.auth import (
    AdminUser,
    ArtistUser,
    CurrentUser,
    get_current_user,
    require_roles,
)
from app.dependencies.deps import get_app_settings

__all__ = [
    "AdminUser",
    "ArtistUser",
    "CurrentUser",
    "get_app_settings",
    "get_current_user",
    "require_roles",
]
