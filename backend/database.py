"""PostgreSQL engine, session handling and connectivity checks (Issue #18).

The engine is created lazily so the API can start (and serve the existing
SQLite-backed wallet endpoints) before PostgreSQL is configured in a local
environment. Connection failures raise :class:`DatabaseUnavailable` with a
message that is safe to return to clients: no DSN, host credentials or driver
details are ever included.
"""

from __future__ import annotations

import logging
from collections.abc import Generator
from functools import lru_cache
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from config import DatabaseConfigError, get_settings

logger = logging.getLogger("tapride.database")


class DatabaseUnavailable(RuntimeError):
    """PostgreSQL could not be reached or the connection is misconfigured."""


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    settings = get_settings()
    try:
        url = settings.sqlalchemy_url()
    except DatabaseConfigError as exc:
        raise DatabaseUnavailable(str(exc)) from exc

    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_timeout=settings.db_pool_timeout,
        pool_recycle=settings.db_pool_recycle,
        echo=settings.db_echo,
        future=True,
        connect_args={
            "connect_timeout": settings.db_connect_timeout,
            "application_name": "tapride-api",
        },
    )


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it."""
    session = get_session_factory()()
    try:
        yield session
    except SQLAlchemyError:
        session.rollback()
        logger.exception("Database session rolled back after an error")
        raise
    finally:
        session.close()


def check_connection() -> None:
    """Run ``SELECT 1`` against PostgreSQL.

    Raises:
        DatabaseUnavailable: if configuration is missing, the server is down or
            the credentials/network are rejected. The raised message never
            contains the connection string.
    """
    settings = get_settings()
    if not settings.is_configured:
        raise DatabaseUnavailable(
            "PostgreSQL is not configured. Set DATABASE_URL or the DB_* variables."
        )
    try:
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        logger.error("PostgreSQL connection failed for %s", settings.safe_target())
        logger.debug("Database error details: %s", exc.__class__.__name__)
        raise DatabaseUnavailable(
            "Unable to connect to the PostgreSQL database. "
            "Check that the server is running and the credentials are correct."
        ) from exc


def database_status() -> dict[str, Any]:
    """Return a serialisable health snapshot for the API."""
    settings = get_settings()
    if not settings.is_configured:
        return {
            "status": "not_configured",
            "target": None,
            "detail": "Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER to enable PostgreSQL.",
        }
    try:
        check_connection()
    except DatabaseUnavailable as exc:
        return {"status": "unavailable", "target": settings.safe_target(), "detail": str(exc)}
    return {"status": "connected", "target": settings.safe_target(), "detail": None}


def dispose_engine() -> None:
    """Release pooled connections on shutdown."""
    if get_engine.cache_info().currsize:
        get_engine().dispose()
    get_engine.cache_clear()
    get_session_factory.cache_clear()
