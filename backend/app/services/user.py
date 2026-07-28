"""User profile services (avatar upload)."""

from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserPublic
from app.services.storage import StorageService, get_storage_service
from app.utils.files import read_and_validate_avatar


class UserService:
    def __init__(
        self,
        session: AsyncSession,
        storage: StorageService | None = None,
    ) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.storage = storage or get_storage_service()
        self.settings = get_settings()

    async def upload_avatar(self, *, user: User, avatar: UploadFile) -> UserPublic:
        """Upload avatar to storage, replace old file, persist public URL."""
        validated = await read_and_validate_avatar(
            avatar,
            max_bytes=self.settings.max_avatar_upload_bytes,
        )

        await self.storage.delete_by_public_url(user.avatar_url)

        path = f"{user.id}/avatar{validated.extension}"
        public_url = await self.storage.upload_file(
            bucket=self.storage.bucket_avatars,
            path=path,
            content=validated.content,
            content_type=validated.content_type,
        )

        user.avatar_url = public_url
        await self.session.flush()
        await self.session.commit()
        await self.session.refresh(user)
        return UserPublic.model_validate(user)

    async def clear_avatar(self, *, user: User) -> UserPublic:
        """Remove avatar from storage and clear DB field."""
        await self.storage.delete_by_public_url(user.avatar_url)
        user.avatar_url = None
        await self.session.flush()
        await self.session.commit()
        await self.session.refresh(user)
        return UserPublic.model_validate(user)
