import { useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTripStore } from '../store';
import { fetchOptimizedOrder } from '../lib/routing';
import { formatDistance, formatDuration } from '../lib/format';
import { downloadNodeAsPng } from '../lib/downloadImage';
import StopCard from './StopCard';
import PlaceSearch from './PlaceSearch';
import TripSummaryCard from './TripSummaryCard';

/**
 * Left sidebar: the ordered, drag-reorderable list of stops plus trip-wide
 * controls (add a stop, start over, download a shareable summary image).
 */
export default function Sidebar() {
  const stops = useTripStore((s) => s.stops);
  const setStops = useTripStore((s) => s.setStops);
  const addStop = useTripStore((s) => s.addStop);
  const startOver = useTripStore((s) => s.startOver);
  const routeInfo = useTripStore((s) => s.routeInfo);
  const routeStatus = useTripStore((s) => s.routeStatus);

  // Off-screen summary card we rasterize to PNG (see render at the bottom).
  const cardRef = useRef<HTMLDivElement>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Render the off-screen summary card to a PNG and download it.
  async function onDownloadImage() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await downloadNodeAsPng(cardRef.current, 'roadtrip.png');
    } catch {
      alert('Could not generate the image. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  // Reorder intermediate stops to minimize total drive time (keeps start/end).
  async function onOptimize() {
    setOptimizing(true);
    try {
      const reordered = await fetchOptimizedOrder(stops);
      if (reordered) setStops(reordered);
      else alert('Could not optimize the route. Keeping current order.');
    } catch {
      alert('Optimize failed (routing service unavailable). Keeping current order.');
    } finally {
      setOptimizing(false);
    }
  }

  // dnd-kit: a small pointer movement threshold so clicks on buttons still work.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stops.findIndex((s) => s.id === active.id);
    const newIndex = stops.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setStops(arrayMove(stops, oldIndex, newIndex));
  }

  return (
    <aside className="flex h-full w-80 flex-col border-r">
      <div className="border-b p-2">
        <h2 className="font-bold">Your trip</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="border px-2 py-1 text-sm"
            disabled={downloading || stops.length === 0}
            onClick={onDownloadImage}
          >
            {downloading ? 'Generating…' : 'Download image'}
          </button>
          <button
            type="button"
            className="border px-2 py-1 text-sm"
            onClick={() => {
              if (confirm('Clear this trip and start over?')) startOver();
            }}
          >
            Start over
          </button>
        </div>

        {/* Trip totals from the routing service. */}
        <div className="mt-2 text-sm">
          {routeStatus === 'loading' && <span>Calculating route…</span>}
          {routeStatus === 'error' && (
            <span>Route unavailable (showing straight lines).</span>
          )}
          {routeStatus === 'idle' && routeInfo && (
            <span>
              Total: {formatDistance(routeInfo.totalDistance)} ·{' '}
              {formatDuration(routeInfo.totalDuration)}
            </span>
          )}
          {routeStatus === 'idle' && !routeInfo && stops.length < 2 && (
            <span>Add at least two stops to see drive time.</span>
          )}
        </div>

        {/* Optional: minimize total drive time by reordering middle stops. */}
        {stops.length >= 4 && (
          <div className="mt-2">
            <button
              type="button"
              className="border px-2 py-1 text-sm"
              disabled={optimizing}
              onClick={onOptimize}
            >
              {optimizing ? 'Optimizing…' : 'Optimize order'}
            </button>
          </div>
        )}
      </div>

      {/* Add a stop anywhere */}
      <div className="border-b p-2">
        <label className="block text-sm">Add a stop</label>
        <PlaceSearch
          placeholder="Search to add a stop…"
          onSelect={(r) => addStop({ name: r.name, coordinates: r.coordinates })}
        />
      </div>

      {/* Ordered, draggable list */}
      <div className="flex-1 overflow-auto p-2">
        {stops.length === 0 ? (
          <p className="text-sm text-gray-600">No stops yet.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={stops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {stops.map((stop, i) => (
                  <StopCard
                    key={stop.id}
                    stop={stop}
                    index={i}
                    total={stops.length}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Off-screen summary card, kept mounted so it can be rasterized to PNG
          on demand. Positioned far off-screen (not display:none) so it still
          has real layout for html-to-image to capture. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: -10000,
          pointerEvents: 'none',
        }}
      >
        <TripSummaryCard ref={cardRef} stops={stops} routeInfo={routeInfo} />
      </div>
    </aside>
  );
}
