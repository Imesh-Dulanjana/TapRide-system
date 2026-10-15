"""Smoke tests for wallet DB operations (Issue #25 acceptance criteria)."""

import sqlite3

from wallet_db import (
    create_passenger,
    get_wallet_balance,
    init_db,
    list_transactions,
    record_topup,
)


def main() -> None:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    init_db(conn)

    pid = create_passenger(conn, "passenger@example.com")

    # Balance starts at 0 and auto-creates wallet.
    assert get_wallet_balance(conn, pid) == 0

    # Top-ups accumulate + record status/timestamps.
    t1 = record_topup(conn, pid, 1000, reference="TOPUP-001")
    assert t1.status == "completed" and t1.balance_after == 1000 and t1.created_at
    t2 = record_topup(conn, pid, 500, reference="TOPUP-002")
    assert t2.balance_after == 1500
    assert get_wallet_balance(conn, pid) == 1500

    # History newest-first.
    history = list_transactions(conn, pid)
    assert len(history) == 2 and history[0].reference == "TOPUP-002"

    # Invalid amounts rejected; balance unchanged (consistency).
    for bad in (0, -50):
        try:
            record_topup(conn, pid, bad, reference=f"BAD-{bad}")
        except ValueError:
            pass
        else:
            raise AssertionError(f"amount {bad} should fail")
    assert get_wallet_balance(conn, pid) == 1500

    # Duplicate references rejected.
    try:
        record_topup(conn, pid, 100, reference="TOPUP-001")
    except ValueError:
        pass
    else:
        raise AssertionError("duplicate reference should fail")

    print("wallet_db tests passed: balance, top-up, status/timestamps, consistency OK")


if __name__ == "__main__":
    main()
