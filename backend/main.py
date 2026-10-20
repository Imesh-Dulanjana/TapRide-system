import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import get_settings
from database import (
    DatabaseUnavailable,
    check_connection,
    database_status,
    dispose_engine,
)
from wallet_db import get_connection, get_wallet_balance, init_db, record_topup

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("tapride")

WALLET_DB_PATH = "wallet.db"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialise the wallet store and probe PostgreSQL (Issue #18)."""
    settings = get_settings()
    if settings.is_configured:
        try:
            check_connection()
            logger.info("Connected to PostgreSQL at %s", settings.safe_target())
        except DatabaseUnavailable as exc:
            logger.warning("PostgreSQL unavailable at startup: %s", exc)
    else:
        logger.info("PostgreSQL is not configured; /health/db will report not_configured.")

    conn = get_connection(WALLET_DB_PATH)
    try:
        init_db(conn)
    finally:
        conn.close()

    try:
        yield
    finally:
        dispose_engine()


app = FastAPI(
    title="TapRide API",
    description="Digital Wallet and Bus Management System API",
    version="1.0.0",
    lifespan=lifespan,
)


class TopUpRequest(BaseModel):
    amount: float
    reference: str | None = None


@app.get("/")
def root():
    return {
        "message": "TapRide API is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/db")
def database_health():
    """Report PostgreSQL connectivity without leaking connection details."""
    status = database_status()
    return JSONResponse(
        status_code=200 if status["status"] == "connected" else 503,
        content=status,
    )


@app.get("/wallets/{passenger_id}/balance")
def wallet_balance(passenger_id: int):
    """Retrieve wallet balance for a passenger (Issue #25)."""
    conn = get_connection(WALLET_DB_PATH)
    try:
        return {"passenger_id": passenger_id, "balance": get_wallet_balance(conn, passenger_id)}
    finally:
        conn.close()


@app.post("/wallets/{passenger_id}/topup", status_code=201)
def wallet_topup(passenger_id: int, body: TopUpRequest):
    """Record a wallet top-up transaction (Issue #25)."""
    conn = get_connection(WALLET_DB_PATH)
    try:
        try:
            tx = record_topup(conn, passenger_id, body.amount, body.reference)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        return {
            "id": tx.id,
            "type": tx.type,
            "amount": tx.amount,
            "balance_after": tx.balance_after,
            "status": tx.status,
            "reference": tx.reference,
            "created_at": tx.created_at,
        }
    finally:
        conn.close()
