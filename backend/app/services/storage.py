"""Async Supabase Storage service (sole object-storage backend)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import AppException, BadRequestError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StoredObjectRef:
    """Resolved bucket + object path for delete/update."""

    bucket: str
    path: str


class StorageService:
    """
    Reusable async Supabase Storage client.

    Public API:
      - upload_file()
      - delete_file()
      - get_public_url()
      - health()
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        if not self.settings.supabase_url or not self.settings.supabase_service_role_key:
            raise AppException(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
                status_code=500,
                code="storage_misconfigured",
            )
        self._supabase_base = self.settings.supabase_url.rstrip("/")
        self._storage_api = f"{self._supabase_base}/storage/v1"
        self._client: httpx.AsyncClient | None = None

    @property
    def bucket_songs(self) -> str:
        return self.settings.supabase_storage_bucket_songs

    @property
    def bucket_covers(self) -> str:
        return self.settings.supabase_storage_bucket_covers

    @property
    def bucket_avatars(self) -> str:
        return self.settings.supabase_storage_bucket_avatars

    def get_public_url(self, *, bucket: str, path: str) -> str:
        """Return a publicly reachable Supabase Storage URL."""
        clean = path.lstrip("/")
        encoded = "/".join(quote(part, safe="") for part in clean.split("/"))
        return f"{self._storage_api}/object/public/{bucket}/{encoded}"

    async def upload_file(
        self,
        *,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str,
        upsert: bool = True,
    ) -> str:
        """Upload bytes to Supabase Storage and return the public URL."""
        if not content:
            raise BadRequestError("Upload content is empty")
        clean = path.lstrip("/")
        await self._upload(
            bucket=bucket,
            path=clean,
            content=content,
            content_type=content_type,
            upsert=upsert,
        )
        return self.get_public_url(bucket=bucket, path=clean)

    async def delete_file(self, *, bucket: str, path: str) -> None:
        """Delete an object (best-effort with logging on failure)."""
        clean = path.lstrip("/")
        try:
            await self._delete(bucket=bucket, path=clean)
        except Exception:
            logger.warning(
                "Failed to delete Supabase object bucket=%s path=%s",
                bucket,
                clean,
                exc_info=True,
            )

    async def delete_by_public_url(self, url: str | None) -> None:
        """Parse a stored public URL and delete the underlying object."""
        ref = self.parse_public_url(url)
        if ref:
            await self.delete_file(bucket=ref.bucket, path=ref.path)

    def parse_public_url(self, url: str | None) -> StoredObjectRef | None:
        """Extract bucket + path from a Supabase public object URL."""
        if not url:
            return None
        marker = "/storage/v1/object/public/"
        idx = url.find(marker)
        if idx < 0:
            return None
        remainder = url[idx + len(marker) :]
        parts = remainder.split("/", 1)
        if len(parts) != 2 or not parts[0] or not parts[1]:
            return None
        return StoredObjectRef(bucket=parts[0], path=parts[1].split("?", 1)[0])

    async def health(self) -> dict[str, Any]:
        """Probe Supabase Storage connectivity and required buckets."""
        try:
            existing = await self._list_bucket_names()
            buckets_ok = (
                self.bucket_songs in existing
                and self.bucket_covers in existing
                and self.bucket_avatars in existing
            )
            if buckets_ok:
                return {"status": "healthy", "storage": "supabase"}
            return {
                "status": "unhealthy",
                "storage": "supabase",
                "detail": "One or more required buckets are missing",
                "buckets": {
                    "songs": self.bucket_songs in existing,
                    "covers": self.bucket_covers in existing,
                    "avatars": self.bucket_avatars in existing,
                },
            }
        except Exception as exc:
            logger.warning("Supabase Storage health check failed: %s", exc)
            return {
                "status": "unhealthy",
                "storage": "supabase",
                "detail": str(exc),
            }

    async def verify_startup(self) -> None:
        """Validate Supabase Storage + required buckets at startup."""
        result = await self.health()
        if result.get("status") != "healthy":
            raise AppException(
                "Supabase Storage is unavailable or misconfigured",
                status_code=503,
                code="storage_unavailable",
                details=result,
            )
        logger.info(
            "Supabase Storage verified buckets=%s,%s,%s",
            self.bucket_songs,
            self.bucket_covers,
            self.bucket_avatars,
        )

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    def _headers(self, *, content_type: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "apikey": self.settings.supabase_service_role_key or "",
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    async def _upload(
        self,
        *,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str,
        upsert: bool,
    ) -> None:
        client = await self._http()
        encoded = "/".join(quote(part, safe="") for part in path.split("/"))
        url = f"{self._storage_api}/object/{bucket}/{encoded}"
        headers = self._headers(content_type=content_type)
        headers["x-upsert"] = "true" if upsert else "false"
        try:
            response = await client.post(url, content=content, headers=headers)
        except httpx.HTTPError as exc:
            raise AppException(
                "Supabase Storage is unavailable",
                status_code=503,
                code="storage_unavailable",
                details=str(exc),
            ) from exc

        if response.status_code >= 400:
            logger.error(
                "Supabase upload error status=%s body=%s",
                response.status_code,
                response.text[:500],
            )
            raise AppException(
                "Failed to upload file to Supabase Storage",
                status_code=502,
                code="storage_upload_failed",
                details=response.text[:500],
            )

    async def _delete(self, *, bucket: str, path: str) -> None:
        client = await self._http()
        url = f"{self._storage_api}/object/{bucket}"
        headers = self._headers(content_type="application/json")
        try:
            response = await client.request(
                "DELETE",
                url,
                headers=headers,
                json={"prefixes": [path]},
            )
        except httpx.HTTPError as exc:
            raise AppException(
                "Supabase Storage is unavailable",
                status_code=503,
                code="storage_unavailable",
                details=str(exc),
            ) from exc
        if response.status_code >= 400:
            logger.warning(
                "Supabase delete warning status=%s body=%s",
                response.status_code,
                response.text[:300],
            )

    async def _list_bucket_names(self) -> set[str]:
        client = await self._http()
        url = f"{self._storage_api}/bucket"
        try:
            response = await client.get(url, headers=self._headers())
        except httpx.HTTPError as exc:
            raise AppException(
                "Supabase Storage is unavailable",
                status_code=503,
                code="storage_unavailable",
                details=str(exc),
            ) from exc
        if response.status_code >= 400:
            raise AppException(
                "Failed to list Supabase Storage buckets",
                status_code=503,
                code="storage_unavailable",
                details=response.text[:500],
            )
        payload = response.json()
        if not isinstance(payload, list):
            return set()
        return {
            str(item["name"])
            for item in payload
            if isinstance(item, dict) and item.get("name")
        }


_storage_service: StorageService | None = None


def get_storage_service() -> StorageService:
    """Return a cached StorageService instance."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service


def reset_storage_service() -> None:
    """Clear cached service (tests / settings reload)."""
    global _storage_service
    _storage_service = None
