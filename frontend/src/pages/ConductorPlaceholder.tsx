import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import BottomNav from '../features/offline-sync/components/BottomNav';

// The other conductor tabs share this page until their own tickets exist,
// so the bottom navigation never points at a dead link.
interface ConductorPlaceholderProps {
  title: string;
}

export default function ConductorPlaceholder({ title }: ConductorPlaceholderProps) {
  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[#14213d]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-3 pb-28 pt-3 sm:px-4 sm:pt-5 md:max-w-2xl lg:max-w-6xl lg:px-8 lg:pb-10 lg:pt-6">
        <BottomNav />

        <div className="grid flex-1 place-items-center lg:py-10">
          <div className="w-full rounded-2xl border border-[#e4eaf3] bg-white p-8 text-center lg:max-w-md">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf3ff] text-[#2459dc]">
              <Construction className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-['Manrope',sans-serif] text-lg font-extrabold lg:text-xl">
              {title} coming soon
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#6e7a91] lg:text-sm">
              This conductor screen is part of the TapRide roadmap and will be built in a future sprint.
            </p>
            <Link
              to="/conductor/sync"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2156e8] px-5 text-xs font-bold text-white shadow-lg shadow-[#2156e8]/25 transition hover:bg-[#1644ca] lg:text-sm"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to offline sync
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
