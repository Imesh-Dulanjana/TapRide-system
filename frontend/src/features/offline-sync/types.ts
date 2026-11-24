// Data shapes shared by the mock layer, the service and every UI component.
// The real FastAPI endpoints (Sprint 3) only need to return JSON matching these.

export type TransactionType = 'CASH' | 'DIGITAL';

export type PendingStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface PendingTransaction {
  /**
   * Client-generated UUID created when the ticket is stored on the device.
   * It is also the idempotency key sent to the backend, so retrying a sync
   * can never create a duplicate charge.
   */
  id: string;
  type: TransactionType;
  /** Integer LKR, no cents (Rs. 52 -> 52). */
  fare: number;
  route: string; // e.g. "Route 138"
  /** Cash: "Stage 4" | Digital: "Passenger TR-2248". */
  description: string;
  /** ISO-8601 timestamp, e.g. "2026-11-13T11:18:00+05:30". */
  occurredAt: string;
  status: PendingStatus;
}

export interface SyncSummary {
  pending: number;
  synced: number;
  total: number;
  /** 0-100, rounded for display (16 of 24 -> 67). */
  percent: number;
}

export interface PendingSyncData {
  summary: SyncSummary;
  transactions: PendingTransaction[];
}

export interface SyncBatchResult {
  syncedIds: string[];
  failedIds: string[];
  /** Optional fresh counters from the server after the batch. */
  summary?: SyncSummary;
}

export type SyncFilter = 'ALL' | 'CASH' | 'DIGITAL';
