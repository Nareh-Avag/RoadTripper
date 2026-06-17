import { useEffect, useRef, useState } from 'react';
import { geocode, type GeocodeResult } from '../lib/nominatim';

/**
 * A debounced place-search autocomplete box backed by Nominatim.
 * Calls `onSelect` with the chosen result. Used both in onboarding and in the
 * sidebar's "add a stop anywhere" box.
 */
export default function PlaceSearch({
  onSelect,
  placeholder = 'Search for a place…',
}: {
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounce the query, then geocode. Aborts stale requests when the user types.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      geocode(trimmed, controller.signal)
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => {
          /* aborted or network error — ignore */
        })
        .finally(() => setLoading(false));
    }, 500); // debounce; the geocoder itself also throttles to 1 req/sec

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const containerRef = useRef<HTMLDivElement>(null);
  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function choose(r: GeocodeResult) {
    onSelect(r);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className="w-full border p-2"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && <div className="p-1 text-sm">Searching…</div>}
      {open && results.length > 0 && (
        <ul className="absolute z-10 max-h-60 w-full overflow-auto border bg-white">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="block w-full border-b p-2 text-left"
                onClick={() => choose(r)}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
