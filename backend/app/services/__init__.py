"""Service package."""

from app.services.auth import AuthService
from app.services.song import SongService
from app.services.storage import get_storage

__all__ = ["AuthService", "SongService", "get_storage"]
