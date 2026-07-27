"""File validation helpers (MIME type, size, magic bytes)."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import UploadFile

from app.core.exceptions import BadRequestError

AUDIO_MIME_TYPES = frozenset({"audio/mpeg", "audio/mp3", "audio/x-mpeg"})
COVER_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})

AUDIO_EXTENSIONS = frozenset({".mp3"})
COVER_EXTENSIONS = {
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
    # ID3v2 tag
    if content[:3] == b"ID3":
        return True
    # MPEG frame sync
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
    """Validate and read an MP3 upload."""
    if file.content_type and file.content_type.lower() not in AUDIO_MIME_TYPES:
        raise BadRequestError(
            f"Invalid audio MIME type '{file.content_type}'. Allowed: audio/mpeg",
        )

    ext = _extension_from_filename(file.filename)
    if ext and ext not in AUDIO_EXTENSIONS:
        raise BadRequestError("Audio file must be an .mp3")

    content = await file.read()
    size = len(content)
    if size == 0:
        raise BadRequestError("Audio file is empty")
    if size > max_bytes:
        raise BadRequestError(
            f"Audio file exceeds maximum size of {max_bytes // (1024 * 1024)} MB",
        )
    if not _looks_like_mp3(content):
        raise BadRequestError("File content is not a valid MP3")

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
    """Validate and read a cover image upload (JPEG/PNG/WebP)."""
    declared = (file.content_type or "").lower()
    if declared and declared not in COVER_MIME_TYPES:
        raise BadRequestError(
            f"Invalid cover MIME type '{file.content_type}'. "
            "Allowed: image/jpeg, image/png, image/webp",
        )

    content = await file.read()
    size = len(content)
    if size == 0:
        raise BadRequestError("Cover image is empty")
    if size > max_bytes:
        raise BadRequestError(
            f"Cover image exceeds maximum size of {max_bytes // (1024 * 1024)} MB",
        )

    detected = _detect_image_mime(content)
    if detected is None:
        raise BadRequestError("Cover file content is not a valid JPEG, PNG, or WebP")
    if declared and declared != detected and not (
        declared == "image/jpg" and detected == "image/jpeg"
    ):
        # Trust magic bytes when declared type mismatches slightly
        pass

    return ValidatedUpload(
        content=content,
        content_type=detected,
        extension=COVER_EXTENSIONS[detected],
        size=size,
    )
