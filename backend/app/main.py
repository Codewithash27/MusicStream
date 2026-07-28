"""MusicStream FastAPI application entrypoint."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.lifespan import lifespan
from app.middleware.logging import RequestLoggingMiddleware

settings = get_settings()

API_DESCRIPTION = """
## MusicStream API

Production-ready backend for a Spotify-like music streaming platform.

### Authentication

Most protected routes expect an **HTTP Bearer** access token.

1. `POST /api/v1/auth/register` — create an account  
2. `POST /api/v1/auth/login` — obtain tokens  
3. Click **Authorize** and paste: `Bearer <access_token>`  
4. `POST /api/v1/auth/refresh` — rotate tokens  
5. `POST /api/v1/auth/logout` — revoke refresh token  
6. `GET /api/v1/auth/me` — current user profile  

### Songs

- `POST /api/v1/songs` / `POST /api/v1/songs/upload` — upload MP3 (+ optional cover) — **ARTIST/ADMIN**  
- `POST /api/v1/songs/{id}/cover` — upload or replace cover  
- `GET /api/v1/songs` — list / search  
- `GET /api/v1/songs/{id}` — detail  
- `PATCH /api/v1/songs/{id}` — update metadata / replace files  
- `DELETE /api/v1/songs/{id}` — delete (DB + storage objects)  
- `POST /api/v1/songs/{id}/play` — increment play count  

### Users

- `POST /api/v1/users/avatar` — upload profile avatar  
- `DELETE /api/v1/users/avatar` — remove avatar  

**New uploads** are stored securely in **Supabase Storage**.  
Legacy `/media/...` URLs (older local uploads) are served read-only when present on disk.

### Roles

| Role | Description |
|------|-------------|
| `USER` | Default listener |
| `ARTIST` | Can publish music (self-register allowed) |
| `ADMIN` | Full access (cannot self-register) |
"""


def create_app() -> FastAPI:
    """Application factory — builds and configures the FastAPI instance."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=API_DESCRIPTION,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
        swagger_ui_parameters={"persistAuthorization": True},
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    app.add_middleware(RequestLoggingMiddleware)
    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Read-only legacy media (songs uploaded before Supabase Storage).
    # New uploads always go to Supabase; this only serves existing /media/... URLs.
    legacy_uploads = Path("uploads")
    legacy_uploads.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=str(legacy_uploads)), name="media")

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "app": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
            "health": f"{settings.api_v1_prefix}/health",
        }

    def custom_openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        schema.setdefault("components", {}).setdefault("securitySchemes", {})
        schema["components"]["securitySchemes"]["BearerAuth"] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste the **access_token** from login/register.",
        }
        schema["security"] = [{"BearerAuth": []}]
        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]
    return app


app = create_app()
