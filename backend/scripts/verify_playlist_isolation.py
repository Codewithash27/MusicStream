"""Check whether Gayatri can see Lucifer's playlists (and vice versa).

Usage (from backend/):
    .\\.venv\\Scripts\\python.exe scripts\\verify_playlist_isolation.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

from app.db.session import AsyncSessionLocal, engine  # noqa: E402
from app.models.playlist import Playlist  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.playlist import PlaylistService  # noqa: E402


async def main() -> None:
    async with AsyncSessionLocal() as session:
        print("=" * 60)
        print("1. All playlists in DB (owner + is_public)")
        print("=" * 60)
        rows = (
            await session.execute(
                select(Playlist.name, Playlist.is_public, User.username)
                .join(User, User.id == Playlist.user_id)
                .order_by(User.username)
            )
        ).all()
        if not rows:
            print("(no playlists)")
        for name, is_public, username in rows:
            print(f"  @{username:<14} {name!r:<24} is_public={is_public}")

        print("\n" + "=" * 60)
        print("2. What each user sees via list API")
        print("=" * 60)
        service = PlaylistService(session)
        users = (
            await session.execute(
                select(User).where(User.username.in_(["gayatrik", "lucifer"]))
            )
        ).scalars().all()
        by_name = {u.username: u for u in users}

        gayatri = by_name.get("gayatrik")
        lucifer = by_name.get("lucifer")
        if gayatri is None or lucifer is None:
            print("Missing gayatrik or lucifer user")
            await engine.dispose()
            return

        g_list = await service.list(user=gayatri, mine=False, limit=100)
        l_list = await service.list(user=lucifer, mine=False, limit=100)

        g_names = [p.name for p in g_list.items]
        l_names = [p.name for p in l_list.items]
        g_foreign = [p.name for p in g_list.items if p.user_id != gayatri.id]
        l_foreign = [p.name for p in l_list.items if p.user_id != lucifer.id]

        print(f"  gayatrik sees : {g_names or '(none)'}")
        print(f"  lucifer  sees : {l_names or '(none)'}")

        print("\n" + "=" * 60)
        print("3. Verdict")
        print("=" * 60)
        if "Aman" in g_names or g_foreign:
            print("NOT RESOLVED — Gayatri still sees someone else's playlist")
            print(f"  foreign for gayatrik: {g_foreign}")
        elif "Hi" in l_names or l_foreign:
            print("NOT RESOLVED — Lucifer still sees Gayatri's playlist")
            print(f"  foreign for lucifer: {l_foreign}")
        else:
            print("RESOLVED — playlists are isolated per user")
            print("  Gayatri does NOT see Aman")
            print("  Lucifer  does NOT see Hi")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
