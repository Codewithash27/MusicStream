"""Diagnose playback/cover media and delete the API-test duplicate song."""

from __future__ import annotations

import json
import sys

import httpx

BASE = "http://127.0.0.1:8000"
API = f"{BASE}/api/v1"
EMAIL = "hukkerikaraman@gmail.com"
PASSWORD = "Aman@27052004"
KEEP_TITLE = "Yeh Fitoor Mera"
DELETE_TITLE = "Yeh Fitoor Mera (API Test)"


def abs_url(path: str | None) -> str | None:
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"{BASE}{path}"


def check_media(client: httpx.Client, label: str, url: str | None) -> None:
    print(f"\n--- {label} ---")
    if not url:
        print("MISSING (null)")
        return
    full = abs_url(url)
    print("stored:", url)
    print("fetch:", full)
    try:
        r = client.get(full, follow_redirects=True)
        print("status:", r.status_code)
        print("content-type:", r.headers.get("content-type"))
        print("bytes:", len(r.content))
        if r.status_code != 200:
            print("FAIL: media not reachable")
        elif len(r.content) < 100:
            print("WARN: file unusually small")
        else:
            print("OK")
    except Exception as exc:  # noqa: BLE001
        print("ERROR:", exc)


def main() -> int:
    with httpx.Client(timeout=60.0) as client:
        print("=== Login ===")
        login = client.post(
            f"{API}/auth/login",
            json={"identifier": EMAIL, "password": PASSWORD},
        )
        print(login.status_code)
        if login.status_code != 200:
            print(login.text)
            return 1
        token = login.json()["tokens"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("\n=== List songs ===")
        listing = client.get(f"{API}/songs", params={"limit": 50})
        data = listing.json()
        print("total:", data.get("total"))
        for song in data.get("items", []):
            print(
                f"- {song['id']} | {song['title']!r} | cover={song.get('cover_url')} | audio={song.get('audio_url')}"
            )

        # Delete API test duplicate(s)
        print("\n=== Delete API test duplicate ===")
        deleted = 0
        for song in list(data.get("items", [])):
            if song["title"] == DELETE_TITLE or (
                song["title"] != KEEP_TITLE and "API Test" in song["title"]
            ):
                rid = song["id"]
                resp = client.delete(f"{API}/songs/{rid}", headers=headers)
                print(f"DELETE {rid} ({song['title']}): {resp.status_code}")
                deleted += 1
        if deleted == 0:
            print("No API-test song found (already deleted?)")

        print("\n=== Re-list after cleanup ===")
        listing = client.get(f"{API}/songs", params={"limit": 50})
        data = listing.json()
        print(json.dumps(data, indent=2, default=str)[:2000])

        keep = next(
            (s for s in data.get("items", []) if s["title"] == KEEP_TITLE),
            data.get("items", [None])[0] if data.get("items") else None,
        )
        if not keep:
            print("No remaining song to probe")
            return 2

        print(f"\n=== Probe media for {keep['title']!r} ===")
        check_media(client, "AUDIO", keep.get("audio_url"))
        check_media(client, "COVER", keep.get("cover_url"))

        # Simulate wrong frontend relative URL (bug)
        print("\n=== Bug check: relative /media on Vite origin ===")
        rel = keep.get("audio_url")
        if rel:
            wrong = f"http://127.0.0.1:5173{rel}"
            try:
                bad = client.get(wrong)
                print("Vite", wrong, "->", bad.status_code, "(expect 404 — this breaks playback/covers)")
            except Exception as exc:  # noqa: BLE001
                print("Vite fetch error:", exc)

        print("\nDONE")
        return 0


if __name__ == "__main__":
    sys.exit(main())
