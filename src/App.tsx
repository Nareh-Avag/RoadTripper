import { useTripStore } from './store';
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

  // Show onboarding on first run: nothing saved and not yet onboarded.
  const showOnboarding = !onboarded && !hasStops;

  if (showOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="relative flex-1">
        <MapView />
      </main>
    </div>
  );
}
