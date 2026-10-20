from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from wallet_db import get_connection, get_wallet_balance, init_db, record_topup

app = FastAPI(
    title="TapRide API",
    description="Digital Wallet and Bus Management System API",
    version="1.0.0",
)


class TopUpRequest(BaseModel):
    amount: float
    reference: str | None = None


@app.on_event("startup")
def startup() -> None:
    conn = get_connection("wallet.db")
    init_db(conn)
    conn.close()


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


@app.get("/wallets/{passenger_id}/balance")
def wallet_balance(passenger_id: int):
    """Retrieve wallet balance for a passenger (Issue #25)."""
    conn = get_connection("wallet.db")
    try:
        return {"passenger_id": passenger_id, "balance": get_wallet_balance(conn, passenger_id)}
    finally:
        conn.close()


@app.post("/wallets/{passenger_id}/topup", status_code=201)
def wallet_topup(passenger_id: int, body: TopUpRequest):
    """Record a wallet top-up transaction (Issue #25)."""
    conn = get_connection("wallet.db")
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