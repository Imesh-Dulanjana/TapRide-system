# TAP-88 Offline / Pending Sync — Sprint 3 API Contract

Status: proposed by the frontend (Sprint 2), to be implemented in Sprint 3.
Screen: `frontend/src/pages/OfflineSync.tsx` (route `/conductor/sync`).
Single swap point: `frontend/src/features/offline-sync/services/offlineSyncService.ts`.

The UI currently talks to a mock service. Setting `VITE_USE_MOCK=false` switches
it to the endpoints below; no UI component changes are required.

---

## 1. Conventions

| Item | Rule |
|------|------|
| Base URL | `VITE_API_BASE_URL` (default `http://localhost:8000`) |
| Prefix | All endpoints start with `/api/v1` |
| Format | JSON, UTF-8 |
| Auth | `Authorization: Bearer <JWT>` on every request |
| Identity | `conductor_id` is resolved from the JWT; never sent in the body |
| Money | `fare` is an **integer LKR** amount (Rs. 52 -> `52`). Never floats/cents. |
| Timestamps | ISO-8601 with an explicit offset, e.g. `2026-11-13T11:18:00+05:30` |
| Field casing | `snake_case` on the wire (the frontend maps to camelCase internally) |
| Errors | FastAPI default shape: `{ "detail": "Human readable message" }` |

The client only renders `PENDING` rows returned by the pending endpoint. Counts
(`16 of 24 synced`, `67% complete`) come from the API summary, not from the list.

---

## 2. Get pending transactions

```
GET /api/v1/conductor/sync/pending?device_id=<optional>
```

### Response `200 OK`

```json
{
  "summary": {
    "pending": 8,
    "synced": 16,
    "total": 24,
    "percent": 67
  },
  "transactions": [
    {
      "id": "a1b2c3d4-0001-4e5f-8a9b-000000000001",
      "type": "DIGITAL",
      "fare": 52,
      "route": "Route 138",
      "description": "Passenger TR-2248",
      "occurred_at": "2026-11-13T11:18:00+05:30",
      "status": "PENDING"
    },
    {
      "id": "a1b2c3d4-0001-4e5f-8a9b-000000000002",
      "type": "CASH",
      "fare": 45,
      "route": "Route 138",
      "description": "Stage 4",
      "occurred_at": "2026-11-13T11:02:00+05:30",
      "status": "PENDING"
    }
  ]
}
```

Field rules:

| Field | Type | Notes |
|-------|------|-------|
| `summary.pending` | integer | Must equal the number of rows returned |
| `summary.synced` | integer | Already synced today |
| `summary.total` | integer | `synced + pending` |
| `summary.percent` | integer 0-100 | `round(synced / total * 100)`; `0` when `total` is 0 |
| `transactions[].id` | UUID string | Client-generated at ticket time; idempotency key |
| `transactions[].type` | `"CASH"` \| `"DIGITAL"` | Drives the Cash/Digital filter |
| `transactions[].fare` | integer | LKR, no decimals |
| `transactions[].route` | string | e.g. `"Route 138"` |
| `transactions[].description` | string | `"Stage 4"` for cash, `"Passenger TR-2248"` for digital |
| `transactions[].occurred_at` | ISO-8601 | When the ticket was captured offline |
| `transactions[].status` | `"PENDING"` \| `"SYNCED"` \| `"FAILED"` | Only `PENDING` rows are listed |

Errors: `401` (expired/missing JWT), `500` (unexpected). On failure the UI shows a
retry card and keeps any previously loaded data.

---

## 3. Sync a batch of pending transactions

```
POST /api/v1/conductor/sync/batch
Authorization: Bearer <JWT>
Idempotency-Key: <batch UUID>
Content-Type: application/json
```

### Request

```json
{
  "device_id": "6f5c2f4e-2f3a-4c1e-9b7d-8a1b2c3d4e5f",
  "transactions": [
    {
      "id": "a1b2c3d4-0001-4e5f-8a9b-000000000002",
      "type": "CASH",
      "fare": 45,
      "route": "Route 138",
      "description": "Stage 4",
      "occurred_at": "2026-11-13T11:02:00+05:30"
    }
  ]
}
```

- `device_id` is a stable UUID the app keeps in `localStorage`
  (`tapride:device-id`) so the server can audit which device pushed a ticket.
- `id` is **required** and must be the same UUID used when the ticket was stored
  offline. This is what makes retries safe.
- A batch contains at most 2 items in the current UI, but the server should accept
  a larger array.

### Response `200 OK`

```json
{
  "accepted": ["a1b2c3d4-0001-4e5f-8a9b-000000000002"],
  "duplicates": [],
  "rejected": [],
  "summary": {
    "pending": 7,
    "synced": 17,
    "total": 24,
    "percent": 71
  }
}
```

| Field | Meaning |
|-------|---------|
| `accepted` | Transaction ids stored successfully in this call |
| `duplicates` | Ids already stored earlier; treated as success, **no double charge** |
| `rejected` | `[{ "id": "...", "reason": "INVALID_FARE" }]`; items stay pending on the client |
| `summary` | Optional fresh counters. If omitted, the client updates counts locally |

Rejection reason codes: `INVALID_FARE`, `UNKNOWN_ROUTE`, `UNAUTHORIZED_DEVICE`,
`MALFORMED_TIMESTAMP`.

---

## 4. Idempotency (required)

The project rule is **idempotent sync using unique transaction IDs**.

1. **Per transaction:** `transactions.id` is a UUID generated on the device when
   the ticket is created offline. The server must enforce a unique constraint:

   ```sql
   UNIQUE (conductor_id, client_transaction_id)
   ```

   Replaying the same transaction returns its id in `duplicates` and must not
   create a second row, a second wallet debit, or change balances again.

2. **Per batch:** `Idempotency-Key` is a fresh UUID for each HTTP attempt. The
   server stores the serialized response against `(conductor_id, idempotency_key)`
   for **24 hours**. Replaying the same key returns the same status and body.
   Reusing a key with a different payload must return `409`.

3. **Retries after failure:** the client keeps unsynced rows in its pending list
   and retries with the **same `transactions.id` values**. A `503`/timeout is not
   proof the write failed, so the server must de-duplicate on `id`.

4. **Partial success:** if some items are rejected, they remain pending; the
   client can retry them alone. Accepted items must not be sent again by the
   client, but the server must still be safe if they are.

---

## 5. Error format and status codes

All errors use FastAPI's default shape:

```json
{ "detail": "Fare must be a positive integer" }
```

| Status | When | Client behaviour |
|--------|------|------------------|
| `200` | Batch processed (even with rejected items) | Remove accepted/duplicate rows, show rejected |
| `401` | Missing/expired JWT | Show session error; Sprint 3 adds redirect to `/login` |
| `409` | `Idempotency-Key` reused with a different payload | Stop syncing, show error |
| `422` | Request validation failed | Show error, keep rows pending |
| `503` | Backend temporarily unavailable | Keep rows pending, retry later with same ids |

---

## 6. Optional endpoint

```
GET /api/v1/conductor/sync/status
```

Returns only the `summary` object (same fields as above). Useful if the screen
later polls for progress instead of updating counts locally.

---

## 7. Frontend mapping

| UI element | Source |
|------------|--------|
| `Pending Sync` big number | `summary.pending` |
| `16 of 24 transactions synced` | `summary.synced`, `summary.total` |
| `67% complete` + progress bar | `summary.percent` |
| List rows | `transactions[]` |
| `Cash` / `Digital` filter chips | `transactions[].type` |
| Fare (`Rs. 52`) | `transactions[].fare` (integer) |
| Time (`11:18 AM`) | `transactions[].occurred_at` formatted in `Asia/Colombo` |

Swap point:

```ts
// frontend/src/features/offline-sync/services/offlineSyncService.ts
export function getPendingSync(): Promise<PendingSyncData>
export function syncTransactions(batch: PendingTransaction[]): Promise<SyncBatchResult>
```

The service maps snake_case wire fields (`occurred_at`) to the camelCase UI types
(`occurredAt`). Keep that mapping in the service so components never change.
