"""Application lifespan: startup and shutdown hooks."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.session import check_database_connection, engine
from app.services.storage import get_storage_service, reset_storage_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Manage application startup and shutdown.

    Startup:
      - Configure logging
      - Verify PostgreSQL connectivity
      - Verify Supabase Storage and required buckets

    Shutdown:
      - Close storage HTTP client
      - Dispose of the database engine connection pool
    """
    setup_logging()
    settings = get_settings()
    logger.info("Starting %s…", app.title)

    db_ok = await check_database_connection()
    if db_ok:
        logger.info("Database connection verified")
    else:
        logger.warning(
            "Database is unreachable at startup. "
            "The API will start, but DB-dependent routes may fail."
        )

    storage = get_storage_service()
    try:
        await storage.verify_startup()
    except Exception as exc:
        if settings.is_production:
            logger.error("Supabase Storage verification failed: %s", exc)
            raise
        logger.warning(
            "Supabase Storage verification failed at startup (%s). "
            "API will start; upload routes may fail until storage is fixed.",
            exc,
        )

    yield

    logger.info("Shutting down %s…", app.title)
    try:
        await storage.aclose()
    except Exception:
        logger.debug("Storage client close failed", exc_info=True)
    reset_storage_service()
    await engine.dispose()
    logger.info("Database engine disposed")
