"""Diagnose MusicStream song upload for a given user."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
EMAIL = "hukkerikaraman@gmail.com"
PASSWORD = "Aman@27052004"


def minimal_mp3() -> bytes:
    """Tiny ID3-tagged payload that passes our MP3 magic-byte check."""
    # ID3v2 header + silence-ish MPEG frame sync bytes
    return b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\xff\xfb\x90\x00" + b"\x00" * 256


def main() -> int:
    print("=== 1) Health ===")
    with httpx.Client(timeout=30.0) as client:
        health = client.get(f"{BASE}/health")
        print(health.status_code, health.json())

        print("\n=== 2) Login ===")
        login = client.post(
            f"{BASE}/auth/login",
            json={"identifier": EMAIL, "password": PASSWORD},
        )
        print("status:", login.status_code)
        if login.status_code != 200:
            print("LOGIN FAILED:", login.text)
            print("\nTrying register as ARTIST...")
            reg = client.post(
                f"{BASE}/auth/register",
                json={
                    "email": EMAIL,
                    "username": "lucifer_upload",
                    "password": PASSWORD,
                    "display_name": "Ash",
                    "role": "ARTIST",
                },
            )
            print("register:", reg.status_code, reg.text[:500])
            if reg.status_code not in (200, 201):
                return 1
            data = reg.json()
        else:
            data = login.json()

        user = data["user"]
        token = data["tokens"]["access_token"]
        print("user:", json.dumps(user, indent=2, default=str))
        print("role:", user.get("role"))
        if user.get("role") not in ("ARTIST", "ADMIN"):
            print("BUG: user is not ARTIST/ADMIN — cannot upload")
            return 2

        headers = {"Authorization": f"Bearer {token}"}

        print("\n=== 3) Auth me ===")
        me = client.get(f"{BASE}/auth/me", headers=headers)
        print(me.status_code, me.json())

        print("\n=== 4) Upload song ===")
        audio_bytes = minimal_mp3()
        files = {
            "audio": ("test-upload.mp3", audio_bytes, "audio/mpeg"),
        }
        form = {
            "title": "Yeh Fitoor Mera (API Test)",
            "duration_seconds": "210",
            "track_number": "1",
        }
        upload = client.post(
            f"{BASE}/songs",
            headers=headers,
            data=form,
            files=files,
        )
        print("status:", upload.status_code)
        print("body:", upload.text[:1000])
        if upload.status_code != 201:
            print("UPLOAD FAILED")
            return 3

        song = upload.json()
        print("\n=== 5) Verify list ===")
        listing = client.get(f"{BASE}/songs", params={"q": "Fitoor"})
        print(listing.status_code, "total=", listing.json().get("total"))
        print("uploaded id:", song.get("id"))
        print("audio_url:", song.get("audio_url"))
        print("\nSUCCESS — backend upload works.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
