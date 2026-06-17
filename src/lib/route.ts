import { lineString, featureCollection } from '@turf/helpers';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { Stop } from '../types';

/**
 * Build a GeoJSON LineString (via Turf) connecting the stops in order.
 * Returns an empty FeatureCollection if there are fewer than 2 stops, since a
 * line needs at least two points.
 */
export function routeLine(stops: Stop[]): FeatureCollection<LineString> {
  if (stops.length < 2) {
    return featureCollection<LineString>([]);
  }
  const coords = stops.map((s) => s.coordinates);
  const line = lineString(coords) as Feature<LineString>;
  return featureCollection<LineString>([line]);
}
