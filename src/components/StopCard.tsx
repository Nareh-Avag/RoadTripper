import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTripStore } from '../store';
import { roleForIndex, ROLE_COLOR, type Stop } from '../types';
import { formatDistance, formatDuration } from '../lib/format';

/**
 * One stop in the sidebar list. Draggable (dnd-kit) for reordering. Holds inline
 * edit (rename / date), a notes panel that saves on blur, a visited toggle, and
 * delete. `index`/`total` are passed so the card can show its derived role.
 */
export default function StopCard({
  stop,
  index,
  total,
}: {
  stop: Stop;
  index: number;
  total: number;
}) {
  const updateStop = useTripStore((s) => s.updateStop);
  const removeStop = useTripStore((s) => s.removeStop);
  const toggleVisited = useTripStore((s) => s.toggleVisited);
  const selectedStopId = useTripStore((s) => s.selectedStopId);
  const selectStop = useTripStore((s) => s.selectStop);
  const routeInfo = useTripStore((s) => s.routeInfo);

  // Drive from the previous stop to this one (legs[i-1] for stop at index i).
  const incomingLeg = index > 0 ? routeInfo?.legs[index - 1] : undefined;

  const role = roleForIndex(index, total);
  const isOpen = selectedStopId === stop.id;

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(stop.name);
  // Local notes draft so we can save on blur without thrashing the store.
  const [notesDraft, setNotesDraft] = useState(stop.notes);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="border p-2">
      {/* Drive figures for the leg arriving at this stop. */}
      {incomingLeg && (
        <div className="mb-1 text-xs text-gray-600">
          ↳ {formatDistance(incomingLeg.distance)} ·{' '}
          {formatDuration(incomingLeg.duration)} from previous
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab border px-1"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
          style={{ backgroundColor: ROLE_COLOR[role] }}
        >
          {index + 1}
        </span>

        <div className="flex-1">
          {editing ? (
            <input
              className="w-full border p-1"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
          ) : (
            <span className={stop.visited ? 'line-through' : ''}>
              {stop.name}
            </span>
          )}
          <div className="text-xs text-gray-600">{role}</div>
        </div>
      </div>

      {/* Arrival date (shown while editing) */}
      {editing && (
        <div className="mt-2">
          <label className="block text-xs">Arrival date</label>
          <input
            type="date"
            className="border p-1"
            value={stop.arrivalDate ?? ''}
            onChange={(e) =>
              updateStop(stop.id, { arrivalDate: e.target.value || undefined })
            }
          />
        </div>
      )}
      {!editing && stop.arrivalDate && (
        <div className="text-xs text-gray-600">Arrives: {stop.arrivalDate}</div>
      )}

      {/* Action row */}
      <div className="mt-2 flex flex-wrap gap-2">
        {editing ? (
          <button
            type="button"
            className="border px-2 py-1 text-sm"
            onClick={() => {
              updateStop(stop.id, { name: nameDraft.trim() || stop.name });
              setEditing(false);
            }}
          >
            Save
          </button>
        ) : (
          <button
            type="button"
            className="border px-2 py-1 text-sm"
            onClick={() => {
              setNameDraft(stop.name);
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}

        <button
          type="button"
          className="border px-2 py-1 text-sm"
          onClick={() => selectStop(isOpen ? null : stop.id)}
        >
          {isOpen ? 'Hide notes' : 'Notes'}
        </button>

        <button
          type="button"
          className="border px-2 py-1 text-sm"
          onClick={() => toggleVisited(stop.id)}
        >
          {stop.visited ? 'Visited ✓' : 'Mark visited'}
        </button>

        <button
          type="button"
          className="border px-2 py-1 text-sm"
          onClick={() => removeStop(stop.id)}
        >
          Delete
        </button>
      </div>

      {/* Notes panel — saves on blur */}
      {isOpen && (
        <div className="mt-2">
          <textarea
            className="w-full border p-1"
            rows={3}
            placeholder="Notes…"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => updateStop(stop.id, { notes: notesDraft })}
          />
        </div>
      )}
    </li>
  );
}
