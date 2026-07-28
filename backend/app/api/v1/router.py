"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import albums, auth, health, playlists, songs, storage, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(storage.router)
api_router.include_router(auth.router)
api_router.include_router(songs.router)
api_router.include_router(users.router)
api_router.include_router(albums.router)
api_router.include_router(playlists.router)
