import PendingTransactionRow from './PendingTransactionRow';
import type { PendingTransaction, SyncFilter } from '../types';

const FILTERS: Array<{ value: SyncFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'CASH', label: 'Cash' },
  { value: 'DIGITAL', label: 'Digital' },
];

interface PendingTransactionsListProps {
  transactions: PendingTransaction[];
  filter: SyncFilter;
  onFilterChange: (filter: SyncFilter) => void;
}

export default function PendingTransactionsList({
  transactions,
  filter,
  onFilterChange,
}: PendingTransactionsListProps) {
  return (
    <section aria-labelledby="pending-transactions-heading" className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id="pending-transactions-heading"
          className="font-['Manrope',sans-serif] text-sm font-extrabold text-[#14213d] lg:text-base"
        >
          Pending Transactions
        </h3>
        <p className="text-[10px] font-medium text-[#8a96a9] lg:text-xs">
          {transactions.length} {transactions.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div role="group" aria-label="Filter pending transactions" className="flex gap-2">
        {FILTERS.map((option) => {
          const isActive = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(option.value)}
              className={`min-h-8 rounded-lg px-4 text-[10px] font-bold transition lg:min-h-9 lg:text-xs ${
                isActive
                  ? 'bg-[#2156e8] text-white shadow-sm shadow-[#2156e8]/25'
                  : 'border border-[#e4eaf3] bg-white text-[#6e7a91] hover:border-[#c9d6f5] hover:text-[#2459dc]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {transactions.length > 0 ? (
        <ul className="space-y-2">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <PendingTransactionRow transaction={transaction} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-[#d7e0ee] bg-[#f7f9fd] px-4 py-6 text-center text-[10px] font-medium text-[#6e7a91] lg:text-xs">
          No {filter === 'CASH' ? 'cash' : 'digital'} transactions are pending.
        </p>
      )}
    </section>
  );
}
