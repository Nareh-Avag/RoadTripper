import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stop, TripFile } from './types';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * RoadTripper global state (Zustand)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Everything the app needs lives here. The whole store is persisted to
 * localStorage (see `persist` config at the bottom) under a single key, so each
 * user keeps their own trip on their own device and it rehydrates on load.
 *
 * To EXTEND the app:
 *   - Add a new field to `Stop` in types.ts, then thread it through `addStop` /
 *     `updateStop`. Persisted trips will simply lack the field until edited.
 *   - Add a new piece of trip-wide state by adding a property + action below.
 *     If it should survive reloads, make sure it's included by `partialize`.
 *   - Bump `PERSIST_VERSION` and add a `migrate` step if you change the stored
 *     shape in a breaking way.
 */

/** Small helper for unique ids without pulling in a uuid dependency. */
function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Input accepted when adding a stop — id/notes/visited get sensible defaults. */
export interface NewStopInput {
  name: string;
  coordinates: [number, number];
  arrivalDate?: string;
}

interface TripState {
  /** Ordered list of stops. Order === travel order; index drives role/color. */
  stops: Stop[];
  /** True once the user has finished (or skipped past) onboarding. */
  onboarded: boolean;
  /** Which stop's detail panel is open in the sidebar, if any. */
  selectedStopId: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Append a stop to the end of the trip. Returns the new stop's id. */
  addStop: (input: NewStopInput) => string;
  /** Patch fields on a single stop. */
  updateStop: (id: string, patch: Partial<Omit<Stop, 'id'>>) => void;
  /** Remove a stop entirely. */
  removeStop: (id: string) => void;
  /** Replace the stop list with a reordered version (used by drag-and-drop). */
  setStops: (stops: Stop[]) => void;
  /** Toggle the visited flag on a stop. */
  toggleVisited: (id: string) => void;
  /** Open/close a stop's detail panel. Pass null to close. */
  selectStop: (id: string | null) => void;

  /** Mark onboarding complete and drop the user into the map. */
  completeOnboarding: () => void;
  /** Wipe the trip and re-trigger onboarding ("Start over"). */
  startOver: () => void;

  /** Replace the whole trip (used by Import JSON). */
  importTrip: (file: TripFile) => void;
  /** Serialize the current trip for Export JSON. */
  exportTrip: () => TripFile;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      stops: [],
      onboarded: false,
      selectedStopId: null,

      addStop: (input) => {
        const stop: Stop = {
          id: makeId(),
          name: input.name,
          coordinates: input.coordinates,
          arrivalDate: input.arrivalDate,
          notes: '',
          visited: false,
        };
        set((s) => ({ stops: [...s.stops, stop] }));
        return stop.id;
      },

      updateStop: (id, patch) =>
        set((s) => ({
          stops: s.stops.map((stop) =>
            stop.id === id ? { ...stop, ...patch } : stop,
          ),
        })),

      removeStop: (id) =>
        set((s) => ({
          stops: s.stops.filter((stop) => stop.id !== id),
          selectedStopId: s.selectedStopId === id ? null : s.selectedStopId,
        })),

      setStops: (stops) => set({ stops }),

      toggleVisited: (id) =>
        set((s) => ({
          stops: s.stops.map((stop) =>
            stop.id === id ? { ...stop, visited: !stop.visited } : stop,
          ),
        })),

      selectStop: (id) => set({ selectedStopId: id }),

      completeOnboarding: () => set({ onboarded: true }),

      startOver: () =>
        set({ stops: [], onboarded: false, selectedStopId: null }),

      importTrip: (file) =>
        set({
          stops: file.stops,
          onboarded: true,
          selectedStopId: null,
        }),

      exportTrip: () => ({ version: 1, stops: get().stops }),
    }),
    {
      // Single localStorage key — this is each user's whole trip.
      name: 'roadtripper-trip',
      version: 1,
      // Only persist the durable trip data, not transient UI selection.
      partialize: (s) => ({ stops: s.stops, onboarded: s.onboarded }),
    },
  ),
);
