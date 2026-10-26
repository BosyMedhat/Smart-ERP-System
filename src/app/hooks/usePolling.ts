import { useEffect, useRef } from 'react';

/**
 * Interval polling that:
 * - skips ticks while the tab is hidden (no requests to a page nobody sees),
 * - can be switched on/off via `active` (e.g. only poll on relevant routes),
 * - always calls the latest `fn` (no stale closures),
 * - cleans up on unmount / deactivation.
 */
export function usePolling(fn: () => void, ms: number, active = true): void {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });

  useEffect(() => {
    if (!active || ms <= 0) return;
    const id = setInterval(() => {
      if (!document.hidden) ref.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms, active]);
}
