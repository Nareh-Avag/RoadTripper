// Road routing via the public OSRM demo server (https://router.project-osrm.org).
//
// Free, no API key. We use two endpoints:
//   - /route  → road geometry + distance/duration for the stops IN ORDER.
//   - /trip   → same, but reorders the intermediate stops to minimize drive time
//               (used by the optional "Optimize order" button).
//
// This is a demo server with fair-use limits — fine for a personal planner. If it
// is unreachable, callers fall back to straight lines (see MapView).

import type { FeatureCollection, LineString } from 'geojson';
import type { Stop } from '../types';

const OSRM_BASE = 'https://router.project-osrm.org';

/** Distance (meters) and duration (seconds) for one leg between two stops. */
export interface RouteLeg {
  distance: number;
  duration: number;
}

export interface RouteInfo {
  /** Road-following geometry, ready to hand to a MapLibre GeoJSON source. */
  geometry: FeatureCollection<LineString>;
  /** Total distance in meters across the whole trip. */
  totalDistance: number;
  /** Total drive time in seconds. */
  totalDuration: number;
  /** Per-leg figures; `legs[i]` is the drive from stop i to stop i+1. */
  legs: RouteLeg[];
}

/** Build the `lng,lat;lng,lat;…` coordinate string OSRM expects. */
function coordParam(stops: Stop[]): string {
  return stops.map((s) => `${s.coordinates[0]},${s.coordinates[1]}`).join(';');
}

function asFeatureCollection(
  geometry: LineString,
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry }],
  };
}

/**
 * Fetch the road route through the stops in their current order.
 * Returns null if there are fewer than 2 stops or the request is aborted.
 */
export async function fetchRoute(
  stops: Stop[],
  signal?: AbortSignal,
): Promise<RouteInfo | null> {
  if (stops.length < 2) return null;

  const url =
    `${OSRM_BASE}/route/v1/driving/${coordParam(stops)}` +
    `?overview=full&geometries=geojson&steps=false&annotations=false`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routing failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`Routing failed: ${data.code ?? 'no route'}`);
  }

  const route = data.routes[0];
  return {
    geometry: asFeatureCollection(route.geometry as LineString),
    totalDistance: route.distance,
    totalDuration: route.duration,
    legs: (route.legs ?? []).map((l: { distance: number; duration: number }) => ({
      distance: l.distance,
      duration: l.duration,
    })),
  };
}

/**
 * Optimize the order of the intermediate stops to minimize total drive time,
 * keeping the first stop as the source and the last as the destination.
 * Returns the stops in their new order (start/end unchanged), or null on failure.
 */
export async function fetchOptimizedOrder(
  stops: Stop[],
  signal?: AbortSignal,
): Promise<Stop[] | null> {
  if (stops.length < 4) return stops; // nothing meaningful to reorder

  const url =
    `${OSRM_BASE}/trip/v1/driving/${coordParam(stops)}` +
    `?source=first&destination=last&roundtrip=false` +
    `&overview=false&geometries=geojson`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Optimize failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.waypoints?.length) {
    throw new Error(`Optimize failed: ${data.code ?? 'no trip'}`);
  }

  // Each input waypoint reports its position in the optimized trip via
  // `waypoint_index`. Rebuild the stop list in that order.
  const reordered: Stop[] = new Array(stops.length);
  data.waypoints.forEach(
    (wp: { waypoint_index: number }, inputIdx: number) => {
      reordered[wp.waypoint_index] = stops[inputIdx];
    },
  );
  // Guard against any gaps (shouldn't happen on a valid response).
  return reordered.every(Boolean) ? reordered : null;
}
