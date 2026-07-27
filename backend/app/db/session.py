"""Async SQLAlchemy database engine and session factory."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.app_debug and not settings.is_production,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Re-export for convenience
__all__ = ["Base", "AsyncSessionLocal", "engine", "get_db", "check_database_connection"]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an async database session.

    Callers (services/repositories) own commit/rollback.
    The session is always closed when the request ends.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def check_database_connection() -> bool:
    """Return True if the database accepts connections."""
    from sqlalchemy import text

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
