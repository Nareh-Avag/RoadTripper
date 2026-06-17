// Small display formatters for route figures.

/** Meters → "412 km" (one decimal under 10 km). */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Seconds → "3 hr 25 min" / "25 min". */
export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return `${h} hr ${m} min`;
}
