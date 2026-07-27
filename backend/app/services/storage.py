"""Object storage abstraction (local filesystem or S3-compatible R2)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Protocol
from urllib.parse import urljoin

from app.core.config import Settings, get_settings
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


class StorageBackend(Protocol):
    async def upload(
        self,
        *,
        key: str,
        content: bytes,
        content_type: str,
    ) -> str:
        """Upload bytes and return a publicly reachable URL."""

    async def delete(self, key: str) -> None:
        """Delete an object by key (best-effort)."""


class LocalStorageBackend:
    """Store files under LOCAL_UPLOAD_DIR and expose via /media URL path."""

    def __init__(self, settings: Settings) -> None:
        self.root = Path(settings.local_upload_dir).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.public_base = "/media/"

    async def upload(
        self,
        *,
        key: str,
        content: bytes,
        content_type: str,
    ) -> str:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return urljoin(self.public_base, key.replace("\\", "/"))

    async def delete(self, key: str) -> None:
        path = self.root / key
        if path.exists():
            path.unlink()


class S3StorageBackend:
    """Cloudflare R2 / AWS S3 via aioboto3."""

    def __init__(self, settings: Settings) -> None:
        if not settings.s3_access_key_id or not settings.s3_secret_access_key:
            raise AppException(
                "S3 credentials are not configured",
                status_code=500,
                code="storage_misconfigured",
            )
        if not settings.s3_public_base_url:
            raise AppException(
                "S3_PUBLIC_BASE_URL is required for R2/S3 storage",
                status_code=500,
                code="storage_misconfigured",
            )
        self.settings = settings
        self.bucket = settings.s3_bucket_name
        self.public_base = settings.s3_public_base_url.rstrip("/") + "/"

    def _client_kwargs(self) -> dict:
        kwargs: dict = {
            "service_name": "s3",
            "aws_access_key_id": self.settings.s3_access_key_id,
            "aws_secret_access_key": self.settings.s3_secret_access_key,
            "region_name": self.settings.s3_region,
        }
        if self.settings.s3_endpoint_url:
            kwargs["endpoint_url"] = self.settings.s3_endpoint_url
        return kwargs

    async def upload(
        self,
        *,
        key: str,
        content: bytes,
        content_type: str,
    ) -> str:
        import aioboto3

        session = aioboto3.Session()
        try:
            async with session.client(**self._client_kwargs()) as client:
                await client.put_object(
                    Bucket=self.bucket,
                    Key=key,
                    Body=content,
                    ContentType=content_type,
                )
        except Exception as exc:
            logger.exception("S3 upload failed for key=%s", key)
            raise AppException(
                "Failed to upload file to object storage",
                status_code=502,
                code="storage_upload_failed",
                details=str(exc),
            ) from exc
        return urljoin(self.public_base, key)

    async def delete(self, key: str) -> None:
        import aioboto3

        session = aioboto3.Session()
        try:
            async with session.client(**self._client_kwargs()) as client:
                await client.delete_object(Bucket=self.bucket, Key=key)
        except Exception:
            logger.warning("Failed to delete object key=%s", key, exc_info=True)


def get_storage() -> StorageBackend:
    """Factory for the configured storage backend."""
    settings = get_settings()
    backend = settings.storage_backend.lower().strip()
    if backend in {"s3", "r2"}:
        return S3StorageBackend(settings)
    if backend == "local":
        return LocalStorageBackend(settings)
    raise AppException(
        f"Unsupported STORAGE_BACKEND '{settings.storage_backend}'",
        status_code=500,
        code="storage_misconfigured",
    )


def key_from_public_url(url: str, settings: Settings | None = None) -> str | None:
    """Best-effort extract storage key from a public URL."""
    settings = settings or get_settings()
    if url.startswith("/media/"):
        return url.removeprefix("/media/")
    base = (settings.s3_public_base_url or "").rstrip("/") + "/"
    if base != "/" and url.startswith(base):
        return url[len(base) :]
    return None
