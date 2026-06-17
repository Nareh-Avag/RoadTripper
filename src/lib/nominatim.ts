// Geocoding via the free OSM Nominatim API.
//
// Nominatim's usage policy asks for at most 1 request per second. We enforce that
// globally with a tiny promise queue so that no matter how many search boxes are
// mounted, requests go out no more than once per second.

export interface GeocodeResult {
  /** Human-readable place name. */
  name: string;
  /** [longitude, latitude]. */
  coordinates: [number, number];
}

const ONE_SECOND = 1000;
let lastRequestAt = 0;
let chain: Promise<unknown> = Promise.resolve();

/**
 * Run `fn` such that successive calls are spaced at least 1s apart.
 *
 * Crucially, a request whose `signal` has already aborted is dropped *without*
 * consuming its 1-second slot. Otherwise slow typing (common on mobile) stacks
 * one queued request per keystroke, each waiting its turn even though the user
 * has already moved on — making the dropdown lag many seconds behind.
 */
function rateLimited<T>(
  fn: () => Promise<T>,
  signal: AbortSignal | undefined,
  fallback: T,
): Promise<T> {
  const run = async (): Promise<T> => {
    // Already stale before we even reach the front of the queue — skip it and
    // don't hold up the requests behind it.
    if (signal?.aborted) return fallback;
    const wait = lastRequestAt + ONE_SECOND - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    // It may have aborted while we waited; bail before spending a real slot.
    if (signal?.aborted) return fallback;
    lastRequestAt = Date.now();
    return fn();
  };
  // Queue behind any in-flight request so spacing is preserved.
  const next = chain.then(run, run);
  chain = next.catch(() => undefined);
  return next;
}

/**
 * Geocode a free-text query. Returns up to `limit` matches.
 * `signal` lets callers abort a stale request (e.g. user kept typing).
 */
export async function geocode(
  query: string,
  signal?: AbortSignal,
  limit = 5,
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return rateLimited(async () => {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=' +
      limit +
      '&q=' +
      encodeURIComponent(trimmed);

    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Geocoding failed: ' + res.status);

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return data.map((d) => ({
      name: d.display_name,
      coordinates: [parseFloat(d.lon), parseFloat(d.lat)] as [number, number],
    }));
  }, signal, [] as GeocodeResult[]);
}
