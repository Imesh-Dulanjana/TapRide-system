import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// Loading, error and all-synced states, grouped in one file because each is
// only a few lines of presentational markup.

/** Grey placeholder blocks shown while the first load is in flight. */
export function SyncSkeleton() {
  return (
    <div aria-label="Loading pending transactions" role="status" className="space-y-3">
      <div className="h-40 animate-pulse rounded-2xl bg-[#e9eef7]" />
      <div className="h-12 animate-pulse rounded-xl bg-[#e9eef7]" />
      <div className="h-24 animate-pulse rounded-2xl bg-[#e9eef7]" />
      <div className="h-20 animate-pulse rounded-2xl bg-[#e9eef7]" />
      <span className="sr-only">Loading pending transactions…</span>
    </div>
  );
}

interface SyncErrorProps {
  message: string;
  onRetry: () => void;
}

/** Full-card error shown when the very first load fails. */
export function SyncError({ message, onRetry }: SyncErrorProps) {
  return (
    <div role="alert" className="rounded-2xl border border-[#e4eaf3] bg-white p-8 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#fdecec] text-[#c2453c]">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-['Manrope',sans-serif] text-sm font-extrabold text-[#14213d] lg:text-base">
        Couldn&rsquo;t load pending transactions
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-[#6e7a91] lg:text-xs">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2156e8] px-5 text-xs font-bold text-white shadow-lg shadow-[#2156e8]/25 transition hover:bg-[#1644ca]"
      >
        Try again
      </button>
    </div>
  );
}

/** Shown when the list is empty because everything has been synced. */
export function AllSyncedState({ total }: { total: number }) {
  return (
    <section role="status" className="rounded-2xl border border-[#c8eedd] bg-[#f0fbf6] px-5 py-8 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#e8fbf1] text-[#168454]">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-['Manrope',sans-serif] text-sm font-extrabold text-[#14213d] lg:text-base">
        All transactions synced
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-[#6e7a91] lg:text-xs">
        Everything stored on this device has been synchronized with TapRide
        {total > 0 ? ` (${total} transactions)` : ''}.
      </p>
    </section>
  );
}
