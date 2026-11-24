import { Banknote, Clock, CreditCard } from 'lucide-react';
import type { PendingStatus, PendingTransaction } from '../types';

// Times are fixed to Sri Lankan time so the mock always matches the design,
// even when the app is opened from a machine in another timezone.
const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Colombo',
});

const STATUS_STYLES: Record<PendingStatus, string> = {
  PENDING: 'bg-[#fff4e5] text-[#c88921]',
  SYNCED: 'bg-[#e8fbf1] text-[#168454]',
  FAILED: 'bg-[#fdecec] text-[#c2453c]',
};

interface PendingTransactionRowProps {
  transaction: PendingTransaction;
}

export default function PendingTransactionRow({ transaction }: PendingTransactionRowProps) {
  const isDigital = transaction.type === 'DIGITAL';

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-[#e4eaf3] bg-white px-3.5 py-3">
      <span
        className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          isDigital ? 'bg-[#edf3ff] text-[#2459dc]' : 'bg-[#e8fbf1] text-[#168454]'
        }`}
      >
        {isDigital ? (
          <CreditCard className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Banknote className="h-4 w-4" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[#14213d] lg:text-sm">{isDigital ? 'Digital Fare' : 'Cash Ticket'}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-[#6e7a91] lg:text-xs">
          {transaction.description} · {transaction.route}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[9px] font-medium text-[#8a96a9] lg:text-[10px]">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {TIME_FORMATTER.format(new Date(transaction.occurredAt))} · Stored locally
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="font-['Manrope',sans-serif] text-sm font-extrabold text-[#14213d] lg:text-base">
          Rs. {transaction.fare}
        </p>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[8px] font-bold tracking-wide lg:text-[9px] ${STATUS_STYLES[transaction.status]}`}
        >
          {transaction.status}
        </span>
      </div>
    </article>
  );
}
