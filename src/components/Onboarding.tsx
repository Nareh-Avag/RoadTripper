import { useState } from 'react';
import { useTripStore, type NewStopInput } from '../store';
import PlaceSearch from './PlaceSearch';

/**
 * First-run, multi-step onboarding overlay. Asks one question at a time:
 *   1. Where does your trip start?
 *   2. Where do you want to stop along the way? (add as many as you want)
 *   3. Where do you want to end up?
 *   4. Return to your starting point? (yes appends the start as a final stop)
 *
 * Each answer is collected here, then committed to the store all at once when the
 * user finishes, so back-and-forth doesn't leave half a trip behind.
 */
type Step = 'start' | 'waypoints' | 'end' | 'return';

export default function Onboarding() {
  const addStop = useTripStore((s) => s.addStop);
  const completeOnboarding = useTripStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>('start');
  const [start, setStart] = useState<NewStopInput | null>(null);
  const [waypoints, setWaypoints] = useState<NewStopInput[]>([]);
  const [end, setEnd] = useState<NewStopInput | null>(null);

  // Commit the collected answers to the store in travel order, then exit.
  function finish(returnToStart: boolean) {
    if (start) addStop(start);
    waypoints.forEach((w) => addStop(w));
    if (end) addStop(end);
    if (returnToStart && start) {
      addStop({ name: start.name, coordinates: start.coordinates });
    }
    completeOnboarding();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
      <div className="w-full max-w-md border bg-white p-6">
        <h1 className="mb-4 text-xl font-bold">Plan your road trip</h1>

        {step === 'start' && (
          <div className="space-y-3">
            <p>Where does your trip start?</p>
            {start && <p className="text-sm">Selected: {start.name}</p>}
            <PlaceSearch
              placeholder="Start location…"
              onSelect={(r) =>
                setStart({ name: r.name, coordinates: r.coordinates })
              }
            />
            <button
              type="button"
              className="border px-3 py-1"
              disabled={!start}
              onClick={() => setStep('waypoints')}
            >
              Next
            </button>
          </div>
        )}

        {step === 'waypoints' && (
          <div className="space-y-3">
            <p>Where do you want to stop along the way?</p>
            {waypoints.length > 0 && (
              <ol className="list-decimal pl-5 text-sm">
                {waypoints.map((w, i) => (
                  <li key={i}>{w.name}</li>
                ))}
              </ol>
            )}
            <PlaceSearch
              placeholder="Add a stop…"
              onSelect={(r) =>
                setWaypoints((prev) => [
                  ...prev,
                  { name: r.name, coordinates: r.coordinates },
                ])
              }
            />
            <p className="text-sm">
              Pick a place above to add it. Add as many as you like, then click
              Done.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="border px-3 py-1"
                onClick={() => setStep('end')}
              >
                Done — next
              </button>
            </div>
          </div>
        )}

        {step === 'end' && (
          <div className="space-y-3">
            <p>Where do you want to end up?</p>
            {end && <p className="text-sm">Selected: {end.name}</p>}
            <PlaceSearch
              placeholder="End location…"
              onSelect={(r) =>
                setEnd({ name: r.name, coordinates: r.coordinates })
              }
            />
            <button
              type="button"
              className="border px-3 py-1"
              disabled={!end}
              onClick={() => setStep('return')}
            >
              Next
            </button>
          </div>
        )}

        {step === 'return' && (
          <div className="space-y-3">
            <p>Do you want to return to your starting point?</p>
            {start && (
              <p className="text-sm">Start: {start.name}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="border px-3 py-1"
                onClick={() => finish(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className="border px-3 py-1"
                onClick={() => finish(false)}
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
