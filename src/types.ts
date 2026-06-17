// A single stop on the trip.
// NOTE: `role` (start / waypoint / end) is intentionally NOT stored here — it is
// derived from a stop's position in the ordered list (see roleForIndex below) so
// that drag-reordering automatically updates marker colors and styling.
export interface Stop {
  id: string;
  name: string;
  /** [longitude, latitude] — GeoJSON order, the convention MapLibre & Turf expect. */
  coordinates: [number, number];
  /** Optional arrival date as an ISO `YYYY-MM-DD` string (from a <input type="date">). */
  arrivalDate?: string;
  /** Freeform notes. */
  notes: string;
  /** Whether the user has marked this stop as visited. */
  visited: boolean;
}

export type StopRole = 'start' | 'waypoint' | 'end';

/** Derive a stop's role purely from its index in the ordered list. */
export function roleForIndex(index: number, total: number): StopRole {
  if (index === 0) return 'start';
  if (index === total - 1) return 'end';
  return 'waypoint';
}

/** Marker color per role. Kept here so styling is easy to find and swap later. */
export const ROLE_COLOR: Record<StopRole, string> = {
  start: 'green',
  waypoint: 'blue',
  end: 'red',
};

/** Shape of an exported / imported trip file. */
export interface TripFile {
  version: 1;
  stops: Stop[];
}
