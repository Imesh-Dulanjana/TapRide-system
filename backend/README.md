# TapRide Backend

FastAPI service for the TapRide digital wallet and bus management system.

## Requirements

- Python 3.11+
- PostgreSQL 15+ (optional for the current SQLite-backed wallet endpoints)

## Setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # then edit the credentials
```

`.env` is git-ignored. Never commit real credentials.

## Configuration

Settings are read from environment variables, falling back to `backend/.env`
(see `config.py`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Full SQLAlchemy URL; takes precedence over `DB_*` | - |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Connection parts | `localhost`, `5432`, - |
| `DB_SSLMODE` | `disable`, `prefer`, `require`, ... | driver default |
| `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, `DB_POOL_RECYCLE` | Connection pool | `5`, `10`, `30`, `1800` |
| `DB_CONNECT_TIMEOUT` | TCP/login timeout in seconds | `5` |
| `DB_ECHO` | Log SQL statements | `false` |

Accepted URL schemes: `postgresql://`, `postgresql+psycopg://`. `postgresql+psycopg2://`
is rewritten to the installed psycopg 3 driver.

## Run

```bash
uvicorn main:app --reload --port 8000
```

- `GET /health` - process health (always 200 while the API is serving).
- `GET /health/db` - PostgreSQL connectivity. Returns `200` with
  `status: connected`, or `503` with `status: unavailable | not_configured`.
  The response never contains the DSN or credentials.
- `GET /docs` - OpenAPI UI.

The API starts even when PostgreSQL is not configured; the wallet endpoints keep
using the local SQLite store until the PostgreSQL migration is completed.

## Database

`database.py` owns the engine, pooled sessions (`get_db`), the `SELECT 1`
connectivity check and safe error reporting. Apply the initial schema from the
repository root:

```bash
psql "$DATABASE_URL" -f docs/database/schema.sql
```

## Tests

```bash
python test_database.py    # offline configuration/error-path checks
pytest -q                  # same checks under pytest
python test_wallet_db.py   # wallet store smoke test
```

The live PostgreSQL check runs only when `TAPRIDE_TEST_DATABASE_URL` points at a
disposable database:

```bash
TAPRIDE_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tapride_test \
    python test_database.py
```
