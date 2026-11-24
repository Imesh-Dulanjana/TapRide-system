import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface SyncHeaderProps {
  isOnline: boolean;
}

export default function SyncHeader({ isOnline }: SyncHeaderProps) {
  return (
    <header className="rounded-2xl border border-[#e4eaf3] bg-white px-3 py-3 shadow-[0_2px_10px_rgba(20,33,61,0.04)] lg:px-5 lg:py-4">
      <div className="flex items-center gap-3">
        <Link
          to="/conductor/dashboard"
          aria-label="Back to conductor dashboard"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e4eaf3] text-[#14213d] transition hover:bg-[#f7f9fd]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="font-['Manrope',sans-serif] text-base font-extrabold leading-tight text-[#14213d] lg:text-lg">
            Offline Sync
          </h1>
          <p className="truncate text-[10px] font-medium text-[#6e7a91] lg:text-xs">
            Manage transactions stored on this device
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wide lg:text-[10px] ${
            isOnline ? 'bg-[#e8fbf1] text-[#168454]' : 'bg-[#fff4e5] text-[#c88921]'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </header>
  );
}
