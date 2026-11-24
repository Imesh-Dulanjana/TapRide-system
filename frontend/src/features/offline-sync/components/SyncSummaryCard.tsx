import type { SyncSummary } from '../types';

interface SyncSummaryCardProps {
  summary: SyncSummary;
  isOnline: boolean;
}

/** Blue summary card: pending count, progress bar and synced percentage. */
export default function SyncSummaryCard({ summary, isOnline }: SyncSummaryCardProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#2156e8] to-[#1748cd] p-5 text-white shadow-lg shadow-[#2156e8]/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#c9d9ff] lg:text-[10px]">
            Pending Transactions
          </p>
          <p className="mt-1 text-xs text-[#e3ebff] lg:text-sm">
            {isOnline ? 'Ready to synchronize' : 'Waiting for network connection'}
          </p>
        </div>
        <p className="font-['Manrope',sans-serif] text-4xl font-extrabold leading-none">
          {summary.pending}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`${summary.percent}% of transactions synced`}
        aria-valuenow={summary.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/25"
      >
        <div
          className="h-full rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${summary.percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold text-[#dce6ff] lg:text-[11px]">
        <span>{summary.synced} of {summary.total} transactions synced</span>
        <span>{summary.percent}% complete</span>
      </div>
    </section>
  );
}
