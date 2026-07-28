"""File validation helpers (MIME type, size, magic bytes)."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import UploadFile

from app.core.exceptions import BadRequestError

# Songs: audio/mpeg only (browsers sometimes send aliases — normalize after check)
AUDIO_MIME_TYPES = frozenset({"audio/mpeg", "audio/mp3", "audio/x-mpeg"})
COVER_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
AVATAR_MIME_TYPES = COVER_MIME_TYPES

AUDIO_EXTENSIONS = frozenset({".mp3"})
IMAGE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@dataclass(frozen=True)
class ValidatedUpload:
    """Validated upload payload ready for storage."""

    content: bytes
    content_type: str
    extension: str
    size: int


def _extension_from_filename(filename: str | None) -> str:
    if not filename or "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def _looks_like_mp3(content: bytes) -> bool:
    if len(content) < 3:
        return False
    if content[:3] == b"ID3":
        return True
    return content[0] == 0xFF and (content[1] & 0xE0) == 0xE0


def _detect_image_mime(content: bytes) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


async def read_and_validate_audio(
    file: UploadFile,
    *,
    max_bytes: int,
) -> ValidatedUpload:
    """Validate and read an MP3 upload (audio/mpeg, max size enforced)."""
    declared = (file.content_type or "").lower().split(";")[0].strip()
    if declared and declared not in AUDIO_MIME_TYPES:
        raise BadRequestError(
            f"Invalid MIME type '{file.content_type}'. Songs must be audio/mpeg",
            details={"allowed": ["audio/mpeg"], "code": "invalid_mime_type"},
        )

    ext = _extension_from_filename(file.filename)
    if ext and ext not in AUDIO_EXTENSIONS:
        raise BadRequestError(
            "Audio file must be an .mp3",
            details={"code": "invalid_mime_type"},
        )

    content = await file.read()
    size = len(content)
    if size == 0:
        raise BadRequestError("Audio file is empty")
    if size > max_bytes:
        raise BadRequestError(
            f"Audio file exceeds maximum size of {max_bytes // (1024 * 1024)} MB",
            details={"code": "file_too_large", "max_bytes": max_bytes},
        )
    if not _looks_like_mp3(content):
        raise BadRequestError(
            "File content is not a valid MP3 (audio/mpeg)",
            details={"code": "invalid_mime_type"},
        )

    return ValidatedUpload(
        content=content,
        content_type="audio/mpeg",
        extension=".mp3",
        size=size,
    )


async def read_and_validate_cover(
    file: UploadFile,
    *,
    max_bytes: int,
) -> ValidatedUpload:
    """Validate cover image (JPEG/PNG/WebP, max size enforced)."""
    return await _read_and_validate_image(
        file,
        max_bytes=max_bytes,
        label="Cover",
        allowed=COVER_MIME_TYPES,
    )


async def read_and_validate_avatar(
    file: UploadFile,
    *,
    max_bytes: int,
) -> ValidatedUpload:
    """Validate avatar image (JPEG/PNG/WebP, max size enforced)."""
    return await _read_and_validate_image(
        file,
        max_bytes=max_bytes,
        label="Avatar",
        allowed=AVATAR_MIME_TYPES,
    )


async def _read_and_validate_image(
    file: UploadFile,
    *,
    max_bytes: int,
    label: str,
    allowed: frozenset[str],
) -> ValidatedUpload:
    declared = (file.content_type or "").lower().split(";")[0].strip()
    if declared and declared not in allowed and declared != "image/jpg":
        raise BadRequestError(
            f"Invalid {label.lower()} MIME type '{file.content_type}'. "
            "Allowed: image/jpeg, image/png, image/webp",
            details={
                "code": "invalid_mime_type",
                "allowed": sorted(allowed),
            },
        )

    content = await file.read()
    size = len(content)
    if size == 0:
        raise BadRequestError(f"{label} image is empty")
    if size > max_bytes:
        raise BadRequestError(
            f"{label} image exceeds maximum size of {max_bytes // (1024 * 1024)} MB",
            details={"code": "file_too_large", "max_bytes": max_bytes},
        )

    detected = _detect_image_mime(content)
    if detected is None or detected not in allowed:
        raise BadRequestError(
            f"{label} file content is not a valid JPEG, PNG, or WebP",
            details={"code": "invalid_mime_type"},
        )

    return ValidatedUpload(
        content=content,
        content_type=detected,
        extension=IMAGE_EXTENSIONS[detected],
        size=size,
    )
