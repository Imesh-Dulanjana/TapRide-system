import { useCallback, useEffect, useRef, useState } from 'react';
import { getPendingSync, syncTransactions } from '../services/offlineSyncService';
import type { PendingSyncData, SyncSummary } from '../types';

export type LoadStatus = 'loading' | 'success' | 'error';
export type SyncPhase = 'idle' | 'syncing' | 'synced' | 'failed';

interface PendingSyncState {
  status: LoadStatus;
  data: PendingSyncData | null;
  error: string | null;
  phase: SyncPhase;
  syncError: string | null;
  /** Temporary message shown inside the "Automatic synchronization" card. */
  autoMessage: string | null;
}

// Small batches keep the progress bar and the list visibly moving.
const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 700;
// Short pause so the "back online" banner is visible before rows disappear.
const AUTO_SYNC_DELAY_MS = 800;

const INITIAL_STATE: PendingSyncState = {
  status: 'loading',
  data: null,
  error: null,
  phase: 'idle',
  syncError: null,
  autoMessage: null,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Move synced items from pending to synced and recompute the progress bar. */
function advanceSummary(summary: SyncSummary, syncedNow: number): SyncSummary {
  const total = summary.total;
  const synced = Math.min(total, summary.synced + syncedNow);
  return {
    total,
    synced,
    pending: Math.max(0, total - synced),
    percent: total === 0 ? 0 : Math.round((synced / total) * 100),
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function usePendingSync(isOnline: boolean) {
  const [state, setState] = useState<PendingSyncState>(INITIAL_STATE);

  // Refs let the async sync loop read the latest values without stale closures.
  const mountedRef = useRef(true);
  const syncingRef = useRef(false);
  const requestRef = useRef(0);
  const dataRef = useRef<PendingSyncData | null>(null);
  const isOnlineRef = useRef(isOnline);
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    dataRef.current = state.data;
  }, [state.data]);

  const applyLoad = useCallback((): Promise<void> => {
    const requestId = ++requestRef.current;
    return getPendingSync()
      .then((data) => {
        // Ignore stale responses (e.g. StrictMode double mount, or a retry).
        if (!mountedRef.current || requestId !== requestRef.current) return;
        dataRef.current = data;
        setState({
          status: 'success',
          data,
          error: null,
          phase: data.transactions.length === 0 ? 'synced' : 'idle',
          syncError: null,
          autoMessage: null,
        });
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || requestId !== requestRef.current) return;
        setState((s) => ({
          ...s,
          status: s.data ? 'success' : 'error',
          error: errorMessage(err),
        }));
      });
  }, []);

  useEffect(() => {
    void applyLoad();
  }, [applyLoad]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    void applyLoad();
  }, [applyLoad]);

  const runSync = useCallback(async (trigger: 'manual' | 'auto'): Promise<void> => {
    const current = dataRef.current;
    // One sync at a time; ignore double clicks and overlapping auto-syncs.
    if (syncingRef.current || !current) return;

    const pending = current.transactions.filter((transaction) => transaction.status === 'PENDING');
    if (pending.length === 0) {
      setState((s) => ({ ...s, phase: 'synced', syncError: null }));
      return;
    }

    // Never pretend to sync while offline.
    if (!isOnlineRef.current) {
      setState((s) => ({
        ...s,
        phase: 'failed',
        syncError: "You're offline. Reconnect to the internet to sync pending transactions.",
      }));
      return;
    }

    syncingRef.current = true;
    setState((s) => ({
      ...s,
      phase: 'syncing',
      syncError: null,
      autoMessage:
        trigger === 'auto'
          ? 'Connection restored. Syncing pending transactions automatically…'
          : s.autoMessage,
    }));

    let syncedSoFar = 0;

    try {
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        // If the connection dropped mid-sync, stop and keep the remaining rows.
        if (!isOnlineRef.current) {
          throw new Error('Connection lost while syncing.');
        }

        const batch = pending.slice(i, i + BATCH_SIZE);
        const result = await syncTransactions(batch);

        // The connection can drop during the request; keep this batch pending so
        // the idempotent retry is safe instead of claiming a false success.
        if (!isOnlineRef.current) {
          throw new Error('Connection lost while syncing.');
        }

        if (result.failedIds.length > 0) {
          throw new Error(`Could not sync ${result.failedIds.length} transaction(s).`);
        }

        syncedSoFar += result.syncedIds.length;
        const syncedIds = new Set(result.syncedIds);
        const latest = dataRef.current;
        if (!mountedRef.current) return;
        if (!latest) break;

        // Update the data ref before setState so the next loop iteration sees it.
        const nextData: PendingSyncData = {
          summary: result.summary ?? advanceSummary(latest.summary, result.syncedIds.length),
          transactions: latest.transactions.filter((transaction) => !syncedIds.has(transaction.id)),
        };
        dataRef.current = nextData;
        setState((s) => ({ ...s, data: nextData, phase: 'syncing', syncError: null }));

        if (i + BATCH_SIZE < pending.length) {
          await delay(BATCH_DELAY_MS);
        }
      }

      if (!mountedRef.current) return;
      setState((s) => ({
        ...s,
        phase: 'synced',
        syncError: null,
        autoMessage:
          trigger === 'auto' ? 'All pending transactions were synced automatically.' : s.autoMessage,
      }));
    } catch (err) {
      if (!mountedRef.current) return;
      const remaining = dataRef.current?.transactions.length ?? pending.length;
      const reason = errorMessage(err);
      const message =
        syncedSoFar > 0
          ? `Synced ${syncedSoFar}, but ${remaining} still pending. ${reason}`
          : `Sync failed: ${reason}`;
      setState((s) => ({
        ...s,
        phase: 'failed',
        syncError: `${message} Tap sync to retry.`,
        autoMessage:
          trigger === 'auto'
            ? 'Automatic sync paused. It will retry when the connection is stable.'
            : s.autoMessage,
      }));
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const syncNow = useCallback(() => {
    void runSync('manual');
  }, [runSync]);

  // Automatic sync only on an offline -> online transition with pending rows.
  // It deliberately does not run on first load while already online.
  useEffect(() => {
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (!isOnline || wasOnline) return;

    const pendingCount = dataRef.current?.transactions.length ?? 0;
    if (pendingCount === 0) return;

    const timer = window.setTimeout(() => {
      void runSync('auto');
    }, AUTO_SYNC_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isOnline, runSync]);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    phase: state.phase,
    syncError: state.syncError,
    // Hide a stale "connection restored" message while the device is offline.
    autoMessage: isOnline ? state.autoMessage : null,
    syncNow,
    retry,
  };
}
