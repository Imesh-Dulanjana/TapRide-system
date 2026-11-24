import { useEffect, useMemo, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  /** true when ?mock=online or ?mock=offline is overriding the real browser state. */
  isForced: boolean;
}

/** Reads the demo override from the URL: ?mock=offline or ?mock=online. */
function readNetworkOverride(): 'online' | 'offline' | null {
  const mode = new URLSearchParams(window.location.search).get('mock');
  return mode === 'online' || mode === 'offline' ? mode : null;
}

/**
 * Tracks real connectivity with navigator.onLine plus the window online/offline
 * events. A URL override wins over the browser so both states can be demoed
 * without disconnecting; DevTools "Offline" still works when there is no override.
 */
export function useOnlineStatus(): OnlineStatus {
  const override = useMemo(() => readNetworkOverride(), []);
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline: override ? override === 'online' : browserOnline,
    isForced: override !== null,
  };
}
