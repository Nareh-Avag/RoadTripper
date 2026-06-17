import { useState } from 'react';
import { useTripStore } from './store';
import { useRouteSync } from './hooks/useRouteSync';
import Onboarding from './components/Onboarding';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';

/**
 * App shell. Returning users with a saved trip go straight to the map; first-run
 * users (no saved trip / not onboarded) get the onboarding overlay.
 */
export default function App() {
  const onboarded = useTripStore((s) => s.onboarded);
  const hasStops = useTripStore((s) => s.stops.length > 0);

  // Whether the stops sidebar is shown. Hiding it gives a full-width map view.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Keep the road route + drive-time figures in sync with the stops.
  useRouteSync();

  // Show onboarding on first run: nothing saved and not yet onboarded.
  const showOnboarding = !onboarded && !hasStops;

  if (showOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-full w-full">
      {sidebarOpen && <Sidebar onHide={() => setSidebarOpen(false)} />}
      <main className="relative flex-1">
        <MapView />
        {!sidebarOpen && (
          <button
            type="button"
            className="absolute left-2 top-2 z-10 border bg-white px-2 py-1 text-sm shadow"
            onClick={() => setSidebarOpen(true)}
          >
            Show stops
          </button>
        )}
      </main>
    </div>
  );
}
