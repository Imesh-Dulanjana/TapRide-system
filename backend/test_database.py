"""Connectivity and configuration tests for Issue #18.

Run from the ``backend`` directory:

    python test_database.py        # offline checks + integration check if configured
    pytest test_database.py        # same assertions under pytest

The integration check runs only when ``TAPRIDE_TEST_DATABASE_URL`` points at a
disposable PostgreSQL database, so the suite passes on machines without a
database server.
"""

from __future__ import annotations

import os
from unittest.mock import patch

from pydantic import ValidationError

from config import DatabaseConfigError, Settings
from database import (
    DatabaseUnavailable,
    check_connection,
    dispose_engine,
    get_engine,
    get_session_factory,
)


def test_database_url_is_used_and_secret_is_hidden() -> None:
    settings = Settings(
        _env_file=None,
        database_url="postgresql://tapride:s3cret@db.example.com:6543/tapride_test",
    )
    url = settings.sqlalchemy_url()
    assert url.drivername == "postgresql+psycopg"
    assert url.password == "s3cret"
    assert settings.safe_target() == "db.example.com:6543/tapride_test"
    assert "s3cret" not in settings.safe_target()
    assert "s3cret" not in repr(settings)


def test_individual_parts_are_used_when_no_url() -> None:
    settings = Settings(
        _env_file=None,
        database_url=None,
        db_host="localhost",
        db_port=5433,
        db_name="tapride",
        db_user="tapride",
        db_password="change-me",
        db_sslmode="require",
    )
    url = settings.sqlalchemy_url()
    assert url.host == "localhost"
    assert url.port == 5433
    assert url.database == "tapride"
    assert url.query["sslmode"] == "require"
    assert settings.safe_target() == "localhost:5433/tapride"


def test_missing_configuration_is_reported_clearly() -> None:
    with patch.dict(os.environ, {}, clear=True):
        settings = Settings(_env_file=None)
    assert settings.is_configured is False
    try:
        settings.sqlalchemy_url()
    except DatabaseConfigError as exc:
        assert "DATABASE_URL" in str(exc)
        assert "DB_HOST" in str(exc)
    else:  # pragma: no cover - defensive
        raise AssertionError("Expected DatabaseConfigError")


def test_non_postgres_url_is_rejected() -> None:
    settings = Settings(_env_file=None, database_url="mysql://user:pw@localhost/db")
    try:
        settings.sqlalchemy_url()
    except DatabaseConfigError as exc:
        assert "PostgreSQL" in str(exc)
    else:  # pragma: no cover - defensive
        raise AssertionError("Expected DatabaseConfigError")


def test_invalid_pool_size_is_rejected() -> None:
    try:
        Settings(_env_file=None, db_pool_size=0)
    except ValidationError:
        pass
    else:  # pragma: no cover - defensive
        raise AssertionError("Expected ValidationError")


def test_unreachable_server_raises_safe_error() -> None:
    settings = Settings(
        _env_file=None,
        database_url="postgresql://tapride:sup3rsecret@127.0.0.1:1/tapride",
        db_pool_timeout=2,
        db_connect_timeout=2,
    )
    dispose_engine()
    with patch("database.get_settings", return_value=settings):
        try:
            check_connection()
        except DatabaseUnavailable as exc:
            message = str(exc)
            assert "sup3rsecret" not in message
            assert "127.0.0.1" not in message
            assert "PostgreSQL" in message
        else:  # pragma: no cover - defensive
            raise AssertionError("Expected DatabaseUnavailable")
    dispose_engine()


def test_health_endpoints_report_connection_state() -> None:
    import os as _os

    import config
    import database
    import main

    from fastapi.testclient import TestClient

    clean_env = {key: value for key, value in _os.environ.items() if not key.startswith("DB_")}
    clean_env["DATABASE_URL"] = ""
    with patch.dict(_os.environ, clean_env, clear=True):
        config.get_settings.cache_clear()
        database.dispose_engine()
        try:
            with TestClient(main.app) as client:
                assert client.get("/health").status_code == 200
                response = client.get("/health/db")
                assert response.status_code == 503
                assert response.json()["status"] == "not_configured"
                assert "DATABASE_URL" in response.json()["detail"]
        finally:
            database.dispose_engine()
            config.get_settings.cache_clear()


def run_optional_integration_check() -> str:
    dsn = os.getenv("TAPRIDE_TEST_DATABASE_URL")
    if not dsn:
        return "skipped (set TAPRIDE_TEST_DATABASE_URL to enable)"

    settings = Settings(_env_file=None, database_url=dsn)
    dispose_engine()
    with patch("database.get_settings", return_value=settings):
        check_connection()
        session = get_session_factory()()
        try:
            session.execute(__import__("sqlalchemy").text("SELECT 1"))
        finally:
            session.close()
    dispose_engine()
    return f"connected to {settings.safe_target()}"


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"integration check: {run_optional_integration_check()}")
    print("database tests passed: configuration, URL parsing, safe errors, connectivity")
