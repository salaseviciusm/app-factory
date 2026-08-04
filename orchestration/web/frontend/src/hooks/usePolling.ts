import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Poll `fetcher` every `intervalMs` while the tab is visible. When the page is
 * hidden the timer is paused entirely (cheaper than widening — nothing crosses
 * the tunnel) and a fresh fetch fires the moment the tab becomes visible again.
 */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const alive = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(fetcher, deps);

  const tick = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    try {
      const d = await fn();
      if (!alive.current) return;
      setData(d);
      setError(null);
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (alive.current) {
        setLoading(false);
        if (!document.hidden) {
          timer.current = window.setTimeout(tick, intervalMs);
        }
      }
    }
  }, [fn, intervalMs]);

  useEffect(() => {
    alive.current = true;
    setLoading(true);
    // Pause while hidden; refetch immediately on return to visible.
    const onVisibility = () => {
      if (document.hidden) {
        if (timer.current !== null) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
      } else {
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    void tick();
    return () => {
      alive.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [tick]);

  return { data, error, loading, refresh: tick };
}
