import { useEffect } from 'react';
import { useTripStore } from '../store';
import { fetchRoute } from '../lib/routing';

/**
 * Keeps the store's `routeInfo` in sync with the current stops. Re-fetches the
 * road route (debounced) whenever a stop is added, removed, reordered, or moved.
 * Call this once near the app root.
 */
export function useRouteSync() {
  const stops = useTripStore((s) => s.stops);
  const setRoute = useTripStore((s) => s.setRoute);
  const setRouteLoading = useTripStore((s) => s.setRouteLoading);

  // A stable signature of the ordered coordinates — changes exactly when the
  // route would change (order or positions), not on note/date/visited edits.
  const signature = stops.map((s) => s.coordinates.join(',')).join('|');

  useEffect(() => {
    if (stops.length < 2) {
      setRoute(null, 'idle');
      return;
    }

    const controller = new AbortController();
    setRouteLoading();

    // Small debounce so rapid reorders/edits don't spam the demo server.
    const timer = setTimeout(() => {
      fetchRoute(stops, controller.signal)
        .then((info) => setRoute(info, 'idle'))
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.warn('Route fetch failed; falling back to straight lines.', err);
          setRoute(null, 'error');
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}
