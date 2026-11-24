import { NavLink } from 'react-router-dom';
import { LayoutDashboard, RefreshCw, ScanLine, User } from 'lucide-react';

const TABS = [
  { to: '/conductor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/conductor/scanner', label: 'Scanner', icon: ScanLine },
  { to: '/conductor/sync', label: 'Sync', icon: RefreshCw },
  { to: '/conductor/profile', label: 'Profile', icon: User },
];

/**
 * Conductor navigation. Below lg it is the fixed bottom bar (capped at max-w-lg);
 * from lg it renders as a horizontal tab row under the header instead. NavLink
 * sets aria-current="page" on the active tab automatically.
 */
export default function BottomNav() {
  return (
    <>
      <nav aria-label="Conductor navigation" className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
        <div className="mx-auto w-full max-w-lg border-t border-[#e4eaf3] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(20,33,61,0.05)]">
          <ul className="grid grid-cols-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    className={({ isActive }) =>
                      `flex min-h-14 flex-col items-center justify-center gap-1 text-[9px] font-bold transition ${
                        isActive ? 'text-[#2156e8]' : 'text-[#8a96a9] hover:text-[#2156e8]'
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <nav aria-label="Conductor navigation" className="mt-3 hidden lg:block">
        <ul className="flex items-center gap-1 rounded-2xl border border-[#e4eaf3] bg-white p-1.5 shadow-[0_2px_10px_rgba(20,33,61,0.04)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <li key={tab.to} className="flex-1">
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#edf3ff] text-[#2156e8]'
                        : 'text-[#6e7a91] hover:bg-[#f7f9fd] hover:text-[#2156e8]'
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
