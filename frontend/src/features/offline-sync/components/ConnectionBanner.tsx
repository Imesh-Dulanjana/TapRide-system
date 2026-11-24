import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionBannerProps {
  isOnline: boolean;
}

/** Amber while offline, green once the connection returns. */
export default function ConnectionBanner({ isOnline }: ConnectionBannerProps) {
  if (isOnline) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex gap-3 rounded-xl border border-[#c8eedd] bg-[#f0fbf6] px-4 py-3 lg:px-5 lg:py-4"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-[#168454]">
          <Wifi className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold text-[#136b45] lg:text-sm">You&rsquo;re back online</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-[#3c7a61] lg:text-xs">
            Pending transactions can be synced now, and automatic sync is available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      role="status"
      aria-live="polite"
      className="flex gap-3 rounded-xl border border-[#f3e2b8] bg-[#fff8e8] px-4 py-3 lg:px-5 lg:py-4"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fdebc8] text-[#c88921]">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-bold text-[#8a5a00] lg:text-sm">You&rsquo;re currently offline</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[#8a6b33] lg:text-xs">
          Transactions are safely stored on this device and will sync when the connection returns.
        </p>
      </div>
    </section>
  );
}
