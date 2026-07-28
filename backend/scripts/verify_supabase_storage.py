"""Verify storage health, song upload, cover, and avatar endpoints."""

from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
EMAIL = "hukkerikaraman@gmail.com"
PASSWORD = "Aman@27052004"


def minimal_mp3() -> bytes:
    return b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\xff\xfb\x90\x00" + b"\x00" * 512


def minimal_png() -> bytes:
    # 1x1 transparent PNG
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
        b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def main() -> int:
    print("=== GET /storage/health ===")
    with httpx.Client(timeout=60.0) as client:
        health = client.get(f"{BASE}/storage/health")
        print(health.status_code, health.text)
        if health.status_code != 200:
            return 1

        print("\n=== Login ===")
        login = client.post(
            f"{BASE}/auth/login",
            json={"identifier": EMAIL, "password": PASSWORD},
        )
        print(login.status_code)
        if login.status_code != 200:
            print(login.text)
            return 2
        token = login.json()["tokens"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("\n=== POST /songs/upload ===")
        files = {
            "audio": ("track.mp3", minimal_mp3(), "audio/mpeg"),
            "cover": ("cover.png", minimal_png(), "image/png"),
        }
        data = {"title": "Supabase Storage Test", "duration_seconds": "120", "track_number": "1"}
        upload = client.post(f"{BASE}/songs/upload", headers=headers, data=data, files=files)
        print(upload.status_code, upload.text[:800])
        if upload.status_code != 201:
            return 3
        song = upload.json()
        song_id = song["id"]
        print("audio_url:", song.get("audio_url"))
        print("cover_url:", song.get("cover_url"))

        print("\n=== POST /songs/{id}/cover ===")
        cover = client.post(
            f"{BASE}/songs/{song_id}/cover",
            headers=headers,
            files={"cover": ("cover2.png", minimal_png(), "image/png")},
        )
        print(cover.status_code, cover.text[:500])
        if cover.status_code != 200:
            return 4

        print("\n=== POST /users/avatar ===")
        avatar = client.post(
            f"{BASE}/users/avatar",
            headers=headers,
            files={"avatar": ("avatar.png", minimal_png(), "image/png")},
        )
        print(avatar.status_code, avatar.text[:500])
        if avatar.status_code != 200:
            return 5
        print("avatar_url:", avatar.json().get("avatar_url"))

        print("\n=== DELETE song (cleanup) ===")
        deleted = client.delete(f"{BASE}/songs/{song_id}", headers=headers)
        print(deleted.status_code)

        print("\nSUCCESS")
        return 0


if __name__ == "__main__":
    sys.exit(main())
