"""Authentication request/response schemas."""

from __future__ import annotations

import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.user import UserPublic

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,50}$")


class UserRegister(BaseModel):
    """Payload for creating a new account."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "listener@example.com",
                "username": "music_fan",
                "password": "SecurePass1!",
                "display_name": "Music Fan",
                "role": "USER",
            }
        }
    )

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.USER

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not USERNAME_PATTERN.match(value):
            raise ValueError(
                "Username must be 3–50 characters and contain only "
                "letters, numbers, and underscores"
            )
        return value.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("role")
    @classmethod
    def disallow_admin_self_register(cls, value: UserRole) -> UserRole:
        if value == UserRole.ADMIN:
            raise ValueError("ADMIN role cannot be self-assigned during registration")
        return value


class UserLogin(BaseModel):
    """Payload for email/username + password login."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "identifier": "listener@example.com",
                "password": "SecurePass1!",
            }
        }
    )

    identifier: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Email address or username",
    )
    password: str = Field(..., min_length=1, max_length=128)


class TokenPair(BaseModel):
    """Access + refresh token pair."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds")


class AuthResponse(BaseModel):
    """Tokens plus authenticated user profile."""

    user: UserPublic
    tokens: TokenPair


class RefreshRequest(BaseModel):
    """Request body for rotating tokens."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
        }
    )

    refresh_token: str = Field(..., min_length=10)


class LogoutRequest(BaseModel):
    """Request body for logout (revokes refresh token)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
        }
    )

    refresh_token: str = Field(..., min_length=10)


class MessageResponse(BaseModel):
    """Generic success message."""

    message: str
