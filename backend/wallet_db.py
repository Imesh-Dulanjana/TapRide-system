"""Wallet database operations for TapRide (Issue #25).

Scope (per issue):
- Wallet tables/fields + relationships based on approved schema (Issue #19).
- Retrieve wallet balance for a passenger.
- Record wallet top-up transactions.
- Maintain transaction status + timestamps.
- Keep wallet updates + transaction records consistent (atomic).

Design notes (aligns with Issue #19 core entities + Issue #20 API plan):
- `passengers(id, email, created_at)` — minimal owner entity; wallets FK to it.
- `wallets(id, passenger_id UNIQUE FK, balance, currency, status, created_at, updated_at)`
- `wallet_transactions(id, wallet_id FK, type, amount, balance_after,
  status, reference UNIQUE, created_at)`
  - type: topup | fare | refund | adjustment
  - status: pending | completed | failed

Uses only the Python standard library (sqlite3) so no extra backend
dependencies are required. Foreign keys + explicit transactions guarantee
that a balance update and its transaction row always commit together.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone


DB_SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL UNIQUE,
    balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'LKR',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup','fare','refund','adjustment')),
    amount REAL NOT NULL CHECK (amount > 0),
    balance_after REAL NOT NULL CHECK (balance_after >= 0),
    status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending','completed','failed')),
    reference TEXT UNIQUE,
    created_at TEXT NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at);
"""


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection(db_path: str = "wallet.db") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(DB_SCHEMA)
    conn.commit()


@dataclass
class Wallet:
    id: int
    passenger_id: int
    balance: float
    currency: str
    status: str


@dataclass
class WalletTransaction:
    id: int
    wallet_id: int
    type: str
    amount: float
    balance_after: float
    status: str
    reference: str | None
    created_at: str


def create_passenger(conn: sqlite3.Connection, email: str) -> int:
    cur = conn.execute(
        "INSERT INTO passengers (email, created_at) VALUES (?, ?)",
        (email.strip().lower(), utcnow()),
    )
    conn.commit()
    return int(cur.lastrowid)


def _get_or_create_wallet(conn: sqlite3.Connection, passenger_id: int) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM wallets WHERE passenger_id = ?", (passenger_id,)
    ).fetchone()
    if row is not None:
        return row
    now = utcnow()
    cur = conn.execute(
        "INSERT INTO wallets (passenger_id, balance, currency, status, created_at, updated_at)"
        " VALUES (?, 0, 'LKR', 'active', ?, ?)",
        (passenger_id, now, now),
    )
    wallet_id = int(cur.lastrowid)
    row = conn.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,)).fetchone()
    assert row is not None
    return row


def get_wallet_balance(conn: sqlite3.Connection, passenger_id: int) -> float:
    """Return current wallet balance for a passenger (0 for new wallets)."""
    wallet = _get_or_create_wallet(conn, passenger_id)
    conn.commit()  # persist auto-created wallet
    return float(wallet["balance"])


def record_topup(
    conn: sqlite3.Connection,
    passenger_id: int,
    amount: float,
    reference: str | None = None,
) -> WalletTransaction:
    """Record a top-up and update the balance atomically.

    Raises ValueError for non-positive amounts, suspended/closed wallets,
    or duplicate references. The balance update + transaction insert commit
    in a single DB transaction so they stay consistent.
    """
    if amount <= 0:
        raise ValueError("Top-up amount must be greater than zero.")

    with conn:  # atomic transaction; auto-commit / rollback
        wallet = _get_or_create_wallet(conn, passenger_id)
        if wallet["status"] != "active":
            raise ValueError(f"Wallet is {wallet['status']}; top-up not allowed.")
        new_balance = float(wallet["balance"]) + float(amount)
        now = utcnow()
        conn.execute(
            "UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?",
            (new_balance, now, wallet["id"]),
        )
        try:
            cur = conn.execute(
                "INSERT INTO wallet_transactions"
                " (wallet_id, type, amount, balance_after, status, reference, created_at)"
                " VALUES (?, 'topup', ?, ?, 'completed', ?, ?)",
                (wallet["id"], float(amount), new_balance, reference, now),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError(f"Duplicate transaction reference: {reference}") from exc
        tx_id = int(cur.lastrowid)

    row = conn.execute(
        "SELECT * FROM wallet_transactions WHERE id = ?", (tx_id,)
    ).fetchone()
    assert row is not None
    return WalletTransaction(
        id=int(row["id"]),
        wallet_id=int(row["wallet_id"]),
        type=str(row["type"]),
        amount=float(row["amount"]),
        balance_after=float(row["balance_after"]),
        status=str(row["status"]),
        reference=row["reference"],
        created_at=str(row["created_at"]),
    )


def list_transactions(
    conn: sqlite3.Connection, passenger_id: int, limit: int = 50
) -> list[WalletTransaction]:
    """Newest-first transaction history (supports Issue #20 history endpoint)."""
    rows = conn.execute(
        "SELECT t.* FROM wallet_transactions t"
        " JOIN wallets w ON w.id = t.wallet_id"
        " WHERE w.passenger_id = ? ORDER BY t.id DESC LIMIT ?",
        (passenger_id, limit),
    ).fetchall()
    return [
        WalletTransaction(
            id=int(r["id"]),
            wallet_id=int(r["wallet_id"]),
            type=str(r["type"]),
            amount=float(r["amount"]),
            balance_after=float(r["balance_after"]),
            status=str(r["status"]),
            reference=r["reference"],
            created_at=str(r["created_at"]),
        )
        for r in rows
    ]
