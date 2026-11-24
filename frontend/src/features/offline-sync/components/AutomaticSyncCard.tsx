import { RefreshCw } from 'lucide-react';

const DEFAULT_COPY =
  'Transactions stored on this device will sync automatically when a stable network connection is available.';

interface AutomaticSyncCardProps {
  /** Temporary progress/result message from the sync hook; falls back to the default copy. */
  message: string | null;
}

export default function AutomaticSyncCard({ message }: AutomaticSyncCardProps) {
  return (
    <section className="rounded-2xl border border-[#e4eaf3] bg-white px-4 py-3.5 lg:px-5 lg:py-4">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf3ff] text-[#2459dc]">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#14213d] lg:text-sm">Automatic synchronization</p>
          <p aria-live="polite" className="mt-1 text-[10px] leading-relaxed text-[#6e7a91] lg:text-xs">
            {message ?? DEFAULT_COPY}
          </p>
        </div>
      </div>
    </section>
  );
}
