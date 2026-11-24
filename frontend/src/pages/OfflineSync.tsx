import { useMemo, useState } from 'react';
import AutomaticSyncCard from '../features/offline-sync/components/AutomaticSyncCard';
import BottomNav from '../features/offline-sync/components/BottomNav';
import ConnectionBanner from '../features/offline-sync/components/ConnectionBanner';
import { AllSyncedState, SyncError, SyncSkeleton } from '../features/offline-sync/components/OfflineSyncStates';
import PendingTransactionsList from '../features/offline-sync/components/PendingTransactionsList';
import SyncButton from '../features/offline-sync/components/SyncButton';
import SyncHeader from '../features/offline-sync/components/SyncHeader';
import SyncSummaryCard from '../features/offline-sync/components/SyncSummaryCard';
import { useOnlineStatus } from '../features/offline-sync/hooks/useOnlineStatus';
import { usePendingSync } from '../features/offline-sync/hooks/usePendingSync';
import type { SyncFilter } from '../features/offline-sync/types';

// The page only orchestrates: connectivity, fetching and syncing live in the
// hooks, and each child receives plain typed props.
export default function OfflineSync() {
  const { isOnline } = useOnlineStatus();
  const { status, data, error, phase, syncError, autoMessage, syncNow, retry } = usePendingSync(isOnline);

  // Filtering is local UI state; switching chips never refetches the list.
  const [filter, setFilter] = useState<SyncFilter>('ALL');

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    if (filter === 'ALL') return data.transactions;
    return data.transactions.filter((transaction) => transaction.type === filter);
  }, [data, filter]);

  const pendingCount = data?.transactions.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[#14213d]">
      <div className="mx-auto w-full max-w-lg px-3 pb-28 pt-3 sm:px-4 sm:pt-5 md:max-w-2xl lg:max-w-6xl lg:px-8 lg:pb-10 lg:pt-6">
        <SyncHeader isOnline={isOnline} />

        {/* Fixed bottom bar below lg, horizontal row from lg up. */}
        <BottomNav />

        <main className="mt-3 space-y-4 lg:mt-5">
          <ConnectionBanner isOnline={isOnline} />

          {/*
            Mobile keeps the original single column (wrappers are display:contents
            so their children are the grid items and the order-* classes match the
            old visual order). From lg the wrappers become the 5/7 columns.
          */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
            <div className="contents lg:sticky lg:top-6 lg:col-span-5 lg:flex lg:flex-col lg:gap-4 lg:self-start">
              <section aria-labelledby="pending-sync-heading" className="order-1">
                <h2
                  id="pending-sync-heading"
                  className="font-['Manrope',sans-serif] text-xl font-extrabold tracking-tight lg:text-2xl"
                >
                  Pending Sync
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-[#6e7a91] lg:text-xs">
                  Review transactions waiting to be synchronized with the TapRide system.
                </p>
              </section>

              {status === 'success' && data && (
                <div className="order-2">
                  <SyncSummaryCard summary={data.summary} isOnline={isOnline} />
                </div>
              )}

              {status === 'success' && data && pendingCount > 0 && (
                <div className="order-3">
                  <SyncButton isOnline={isOnline} phase={phase} syncError={syncError} onSync={syncNow} />
                </div>
              )}

              {status === 'success' && data && (
                <div className="order-5">
                  <AutomaticSyncCard message={autoMessage} />
                </div>
              )}
            </div>

            <div className="contents lg:col-span-7 lg:block">
              {status === 'loading' && (
                <div className="order-2">
                  <SyncSkeleton />
                </div>
              )}

              {status === 'error' && (
                <div className="order-2">
                  <SyncError message={error ?? 'Unknown error'} onRetry={retry} />
                </div>
              )}

              {status === 'success' && data && (
                <div className="order-4">
                  {pendingCount > 0 ? (
                    <PendingTransactionsList
                      transactions={filteredTransactions}
                      filter={filter}
                      onFilterChange={setFilter}
                    />
                  ) : (
                    <AllSyncedState total={data.summary.total} />
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
