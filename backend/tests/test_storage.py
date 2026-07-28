"""Unit tests for Supabase Storage helpers (mocked HTTP)."""

from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import UploadFile

from app.core.config import Settings
from app.core.exceptions import BadRequestError
from app.services.storage import StorageService
from app.utils.files import read_and_validate_audio, read_and_validate_avatar


def _settings(**overrides) -> Settings:
    base = {
        "DATABASE_URL": "postgresql+asyncpg://u:p@localhost/db",
        "JWT_SECRET_KEY": "test-secret-key-for-unit-tests-only",
        "SUPABASE_URL": "https://example.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "service-role",
        "SUPABASE_STORAGE_BUCKET_SONGS": "songs",
        "SUPABASE_STORAGE_BUCKET_COVERS": "covers",
        "SUPABASE_STORAGE_BUCKET_AVATARS": "avatars",
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)


def test_public_url_and_parse():
    storage = StorageService(_settings())
    url = storage.get_public_url(bucket="covers", path="artist/song/cover.jpg")
    assert url.startswith("https://example.supabase.co/storage/v1/object/public/covers/")
    ref = storage.parse_public_url(url)
    assert ref is not None
    assert ref.bucket == "covers"
    assert "cover.jpg" in ref.path


@pytest.mark.asyncio
async def test_upload_file_uses_supabase():
    storage = StorageService(_settings())
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "ok"

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    storage._client = mock_client

    url = await storage.upload_file(
        bucket="songs",
        path="a/b/audio.mp3",
        content=b"ID3" + b"\x00" * 32,
        content_type="audio/mpeg",
    )
    assert "/object/public/songs/" in url
    mock_client.post.assert_awaited()
    await storage.aclose()


@pytest.mark.asyncio
async def test_health_healthy_when_buckets_exist():
    storage = StorageService(_settings())
    with patch.object(
        storage,
        "_list_bucket_names",
        AsyncMock(return_value={"songs", "covers", "avatars"}),
    ):
        result = await storage.health()
    assert result == {"status": "healthy", "storage": "supabase"}


@pytest.mark.asyncio
async def test_reject_non_mp3_mime():
    upload = UploadFile(
        filename="x.txt",
        file=io.BytesIO(b"hello"),
        headers={"content-type": "text/plain"},
    )
    with pytest.raises(BadRequestError):
        await read_and_validate_audio(upload, max_bytes=1024)


@pytest.mark.asyncio
async def test_reject_oversized_avatar():
    upload = UploadFile(
        filename="a.png",
        file=io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100),
        headers={"content-type": "image/png"},
    )
    with pytest.raises(BadRequestError):
        await read_and_validate_avatar(upload, max_bytes=10)
