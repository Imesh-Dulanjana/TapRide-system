import { Loader2, RefreshCw } from 'lucide-react';
import type { SyncPhase } from '../hooks/usePendingSync';

interface SyncButtonProps {
  isOnline: boolean;
  phase: SyncPhase;
  syncError: string | null;
  onSync: () => void;
}

/**
 * Full-width manual sync button. It stays prominent while offline (as in the
 * design) but is disabled, so a click can never fake a sync.
 */
export default function SyncButton({ isOnline, phase, syncError, onSync }: SyncButtonProps) {
  const isSyncing = phase === 'syncing';
  const disabled = !isOnline || isSyncing;

  return (
    <div>
      <button
        type="button"
        onClick={onSync}
        disabled={disabled}
        aria-disabled={disabled}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2156e8] px-4 text-xs font-bold text-white shadow-lg shadow-[#2156e8]/25 transition hover:bg-[#1644ca] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none lg:text-sm"
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        {isSyncing ? 'Syncing transactions…' : 'Sync Pending Transactions'}
      </button>

      {!isOnline && (
        <p className="mt-2 text-center text-[10px] font-medium text-[#c88921]">
          Reconnect to the internet to sync pending transactions.
        </p>
      )}

      {syncError && (
        <p role="alert" className="mt-2 text-center text-[10px] font-semibold text-[#c2453c]">
          {syncError}
        </p>
      )}
    </div>
  );
}
