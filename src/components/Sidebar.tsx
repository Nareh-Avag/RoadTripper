import { useRef } from 'react';
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
import type { TripFile } from '../types';
import StopCard from './StopCard';
import PlaceSearch from './PlaceSearch';

/**
 * Left sidebar: the ordered, drag-reorderable list of stops plus trip-wide
 * controls (add a stop, start over, export/import JSON).
 */
export default function Sidebar() {
  const stops = useTripStore((s) => s.stops);
  const setStops = useTripStore((s) => s.setStops);
  const addStop = useTripStore((s) => s.addStop);
  const startOver = useTripStore((s) => s.startOver);
  const importTrip = useTripStore((s) => s.importTrip);
  const exportTrip = useTripStore((s) => s.exportTrip);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function onExport() {
    const data = JSON.stringify(exportTrip(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roadtrip.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as TripFile;
        if (!Array.isArray(parsed.stops)) throw new Error('Invalid file');
        importTrip(parsed);
      } catch {
        alert('Could not import: invalid trip file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // allow re-importing the same file
  }

  return (
    <aside className="flex h-full w-80 flex-col border-r">
      <div className="border-b p-2">
        <h2 className="font-bold">Your trip</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="border px-2 py-1 text-sm" onClick={onExport}>
            Export JSON
          </button>
          <button
            type="button"
            className="border px-2 py-1 text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFile}
          />
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
    </aside>
  );
}
