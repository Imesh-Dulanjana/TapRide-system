"""Application settings loaded from environment variables (Issue #18).

Credentials are read from the environment (or a git-ignored ``backend/.env``)
and are never hard-coded. ``DATABASE_URL`` takes precedence over the individual
``DB_*`` variables so the same code works with managed PostgreSQL providers.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url

ENV_FILE = Path(__file__).with_name(".env")


class DatabaseConfigError(RuntimeError):
    """Raised when the PostgreSQL connection is not configured."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "TapRide API"

    # Either a full SQLAlchemy URL, or the individual connection parts below.
    database_url: SecretStr | None = None
    db_host: str | None = None
    db_port: int = 5432
    db_name: str | None = None
    db_user: str | None = None
    db_password: SecretStr | None = None
    db_sslmode: str | None = None

    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
    db_connect_timeout: int = 5
    db_echo: bool = False

    @field_validator("db_pool_size", "db_pool_timeout", "db_pool_recycle", "db_connect_timeout")
    @classmethod
    def _positive(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Pool settings must be greater than zero.")
        return value

    @field_validator("db_max_overflow")
    @classmethod
    def _non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("DB_MAX_OVERFLOW cannot be negative.")
        return value

    @property
    def is_configured(self) -> bool:
        if self.database_url is not None:
            return bool(self.database_url.get_secret_value().strip())
        return all((self.db_host, self.db_name, self.db_user))

    def sqlalchemy_url(self) -> URL:
        """Build the SQLAlchemy URL without exposing secrets in errors."""
        if self.database_url is not None:
            raw = self.database_url.get_secret_value().strip()
            if not raw:
                raise DatabaseConfigError("DATABASE_URL is set but empty.")
            return _parse_url(raw)

        if not self.is_configured:
            raise DatabaseConfigError(
                "PostgreSQL is not configured. Set DATABASE_URL or DB_HOST, "
                "DB_NAME and DB_USER in the environment (see backend/.env.example)."
            )

        query = {"sslmode": self.db_sslmode} if self.db_sslmode else {}
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.db_user,
            password=self.db_password.get_secret_value() if self.db_password else None,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
            query=query,
        )

    def safe_target(self) -> str:
        """Human-readable connection target that never contains credentials."""
        if self.database_url is not None:
            try:
                url = _parse_url(self.database_url.get_secret_value())
            except DatabaseConfigError:
                return "DATABASE_URL (invalid)"
            return f"{url.host or '?'}:{url.port or 5432}/{url.database or '?'}"
        return f"{self.db_host or '?'}:{self.db_port}/{self.db_name or '?'}"


def _parse_url(raw: str) -> URL:
    try:
        url = make_url(raw)
    except Exception as exc:  # noqa: BLE001 - SQLAlchemy raises several types
        raise DatabaseConfigError("DATABASE_URL is not a valid database URL.") from exc

    if url.drivername in ("postgres", "postgresql"):
        url = url.set(drivername="postgresql+psycopg")
    elif url.drivername == "postgresql+psycopg2":
        url = url.set(drivername="postgresql+psycopg")
    elif url.drivername != "postgresql+psycopg":
        raise DatabaseConfigError(
            "DATABASE_URL must use PostgreSQL (postgresql:// or postgresql+psycopg://)."
        )
    return url


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
