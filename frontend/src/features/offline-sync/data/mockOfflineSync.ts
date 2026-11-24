import type { PendingSyncData, PendingTransaction, SyncBatchResult } from '../types';

// Static snapshot mirroring the TAP-88 Figma design. The UI never knows it is
// not talking to a real server, so Sprint 3 can swap to FastAPI untouched.
const MOCK_TRANSACTIONS: PendingTransaction[] = [
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000001',
    type: 'DIGITAL',
    fare: 52,
    route: 'Route 138',
    description: 'Passenger TR-2248',
    occurredAt: '2026-11-13T11:18:00+05:30',
    status: 'PENDING',
  },
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000002',
    type: 'CASH',
    fare: 45,
    route: 'Route 138',
    description: 'Stage 4',
    occurredAt: '2026-11-13T11:02:00+05:30',
    status: 'PENDING',
  },
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000003',
    type: 'DIGITAL',
    fare: 68,
    route: 'Route 138',
    description: 'Passenger TR-9522',
    occurredAt: '2026-11-13T10:54:00+05:30',
    status: 'PENDING',
  },
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000004',
    type: 'CASH',
    fare: 55,
    route: 'Route 138',
    description: 'Stage 7',
    occurredAt: '2026-11-13T10:47:00+05:30',
    status: 'PENDING',
  },
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000005',
    type: 'DIGITAL',
    fare: 52,
    route: 'Route 138',
    description: 'Passenger TR-1874',
    occurredAt: '2026-11-13T10:39:00+05:30',
    status: 'PENDING',
  },
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000006',
    type: 'CASH',
    fare: 35,
    route: 'Route 138',
    description: 'Stage 2',
    occurredAt: '2026-11-13T10:31:00+05:30',
    status: 'PENDING',
  },
  // Rows 7 and 8 are inferred: the screenshot only shows six of the eight items.
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000007',
    type: 'DIGITAL',
    fare: 40,
    route: 'Route 139',
    description: 'Passenger TR-3110',
    occurredAt: '2026-11-13T10:22:00+05:30',
    status: 'PENDING',
  },
  {
    id: 'a1b2c3d4-0001-4e5f-8a9b-000000000008',
    type: 'CASH',
    fare: 60,
    route: 'Route 139',
    description: 'Stage 5',
    occurredAt: '2026-11-13T10:14:00+05:30',
    status: 'PENDING',
  },
];

// The API already synced 16 of 24 today; only the 8 pending rows are listed.
const MOCK_PENDING_SYNC: PendingSyncData = {
  summary: { pending: 8, synced: 16, total: 24, percent: 67 },
  transactions: MOCK_TRANSACTIONS,
};

// ?mock=empty means everything is already synced (not "no transactions ever").
const EMPTY_PENDING_SYNC: PendingSyncData = {
  summary: { pending: 0, synced: 24, total: 24, percent: 100 },
  transactions: [],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Demo switches enabled with ?mock=slow / empty / error / syncfail / offline /
// online. They let us show every state without changing code or disconnecting.
function getMockMode(): string | null {
  return new URLSearchParams(window.location.search).get('mock');
}

export async function fetchMockPendingSync(): Promise<PendingSyncData> {
  const mode = getMockMode();

  if (mode === 'error') {
    await delay(600);
    throw new Error('Simulated server error (?mock=error)');
  }

  // ?mock=slow stretches the delay so the skeleton placeholders are visible.
  await delay(mode === 'slow' ? 3000 : 600);

  const snapshot = mode === 'empty' ? EMPTY_PENDING_SYNC : MOCK_PENDING_SYNC;
  // structuredClone deep-copies so callers can never mutate the original mock.
  return structuredClone(snapshot);
}

export async function mockSyncBatch(transactions: PendingTransaction[]): Promise<SyncBatchResult> {
  await delay(500);

  if (getMockMode() === 'syncfail') {
    throw new Error('Simulated sync failure (?mock=syncfail)');
  }

  return {
    syncedIds: transactions.map((transaction) => transaction.id),
    failedIds: [],
  };
}
