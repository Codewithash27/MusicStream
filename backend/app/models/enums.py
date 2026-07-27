"""Domain enumerations."""

from enum import Enum


class UserRole(str, Enum):
    """Application user roles."""

    USER = "USER"
    ARTIST = "ARTIST"
    ADMIN = "ADMIN"
