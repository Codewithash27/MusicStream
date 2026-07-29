"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import admin, albums, auth, health, library, playlists, songs, storage, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(storage.router)
api_router.include_router(auth.router)
api_router.include_router(songs.router)
api_router.include_router(library.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(albums.router)
api_router.include_router(playlists.router)
