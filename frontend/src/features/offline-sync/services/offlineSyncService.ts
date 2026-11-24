import { fetchMockPendingSync, mockSyncBatch } from '../data/mockOfflineSync';
import type {
  PendingStatus,
  PendingSyncData,
  PendingTransaction,
  SyncBatchResult,
  SyncSummary,
  TransactionType,
} from '../types';

// Vite exposes env vars as strings, so import.meta.env.VITE_USE_MOCK is
// 'true' | 'false' | undefined. Only the exact string 'false' disables mocks.
const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK !== 'false';
// No trailing slash; the endpoint paths below include /api/v1 themselves.
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const DEVICE_ID_KEY = 'tapride:device-id';

interface ApiErrorBody {
  detail?: string;
}

// Wire shapes follow the FastAPI contract in docs/TAP-88-offline-sync-api-contract.md.
interface WirePendingTransaction {
  id: string;
  type: TransactionType;
  fare: number;
  route: string;
  description: string;
  occurred_at: string;
  status: PendingStatus;
}

interface WirePendingSyncResponse {
  summary: SyncSummary;
  transactions: WirePendingTransaction[];
}

interface WireBatchResponse {
  accepted: string[];
  duplicates: string[];
  rejected: Array<{ id: string; reason: string }>;
  summary?: SyncSummary;
}

/** GET or POST a JSON endpoint, surfacing FastAPI's {"detail": "..."} error text. */
async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.detail) detail = body.detail;
    } catch {
      // Body was not JSON; keep the HTTP status fallback message.
    }
    // TODO(Sprint 3): redirect to /login once real JWT auth is wired.
    if (response.status === 401) {
      throw new Error(`Session expired (401): ${detail}`);
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

/** Stable id for this device; sent with every batch so the server can audit it. */
function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

async function fetchRealPendingSync(): Promise<PendingSyncData> {
  // TODO(Sprint 3): this is the single swap point for the pending list.
  const response = await fetchJson<WirePendingSyncResponse>('/api/v1/conductor/sync/pending');
  return {
    summary: response.summary,
    transactions: response.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      fare: transaction.fare,
      route: transaction.route,
      description: transaction.description,
      occurredAt: transaction.occurred_at,
      status: transaction.status,
    })),
  };
}

async function syncRealBatch(transactions: PendingTransaction[]): Promise<SyncBatchResult> {
  // TODO(Sprint 3): this is the single swap point for pushing pending items.
  // Each item's id is the idempotency key; the header protects the whole batch.
  const response = await fetchJson<WireBatchResponse>('/api/v1/conductor/sync/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      device_id: getDeviceId(),
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        fare: transaction.fare,
        route: transaction.route,
        description: transaction.description,
        occurred_at: transaction.occurredAt,
      })),
    }),
  });

  return {
    syncedIds: response.accepted,
    failedIds: response.rejected.map((item) => item.id),
    summary: response.summary,
  };
}

/** The one place that decides where pending transactions come from. */
export function getPendingSync(): Promise<PendingSyncData> {
  return USE_MOCK ? fetchMockPendingSync() : fetchRealPendingSync();
}

/** The one place that decides how pending transactions are pushed to the API. */
export function syncTransactions(transactions: PendingTransaction[]): Promise<SyncBatchResult> {
  return USE_MOCK ? mockSyncBatch(transactions) : syncRealBatch(transactions);
}
