"""Application lifespan: startup and shutdown hooks."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from app.core.logging import setup_logging
from app.db.session import check_database_connection, engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Manage application startup and shutdown.

    Startup:
      - Configure logging
      - Verify database connectivity

    Shutdown:
      - Dispose of the database engine connection pool
    """
    # --- Startup ---
    setup_logging()
    logger.info("Starting %s…", app.title)

    db_ok = await check_database_connection()
    if db_ok:
        logger.info("Database connection verified")
    else:
        logger.warning(
            "Database is unreachable at startup. "
            "The API will start, but DB-dependent routes may fail."
        )

    yield

    # --- Shutdown ---
    logger.info("Shutting down %s…", app.title)
    await engine.dispose()
    logger.info("Database engine disposed")
