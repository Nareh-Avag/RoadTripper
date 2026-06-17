import { forwardRef } from 'react';
import { roleForIndex, ROLE_COLOR, type Stop } from '../types';
import type { RouteInfo } from '../lib/routing';
import { formatDistance, formatDuration } from '../lib/format';

/**
 * A standalone, shareable summary of the trip — rendered as its own styled
 * element (NOT a screenshot of the sidebar) so it can be exported to PNG.
 *
 * This is intentionally the one styled surface in the app: it's meant to look
 * good on its own as something you'd share. Everything else stays wireframe.
 *
 * Pure/presentational: it takes `stops` + `routeInfo` and renders. A parent keeps
 * it mounted off-screen and hands its ref to the DOM-to-image exporter.
 */
const TripSummaryCard = forwardRef<
  HTMLDivElement,
  { stops: Stop[]; routeInfo: RouteInfo | null }
>(function TripSummaryCard({ stops, routeInfo }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 440,
        boxSizing: 'border-box',
        padding: 28,
        background: '#ffffff',
        color: '#111827',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, letterSpacing: 2, color: '#6b7280' }}>
          ROAD TRIP
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>
          {stops.length > 0
            ? `${stops[0].name.split(',')[0]} → ${stops[stops.length - 1].name.split(',')[0]}`
            : 'My Trip'}
        </div>
        <div style={{ fontSize: 14, color: '#374151', marginTop: 8 }}>
          {stops.length} stop{stops.length === 1 ? '' : 's'}
          {routeInfo && (
            <>
              {'  ·  '}
              {formatDistance(routeInfo.totalDistance)}
              {'  ·  '}
              {formatDuration(routeInfo.totalDuration)}
            </>
          )}
        </div>
      </div>

      {/* Stops, with legs between them */}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stops.map((stop, i) => {
          const role = roleForIndex(i, stops.length);
          const leg = i > 0 ? routeInfo?.legs[i - 1] : undefined;
          return (
            <li key={stop.id}>
              {/* Leg arriving at this stop */}
              {i > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '4px 0 4px 13px',
                    paddingLeft: 18,
                    borderLeft: '2px dashed #d1d5db',
                    minHeight: 22,
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  {leg
                    ? `${formatDistance(leg.distance)} · ${formatDuration(leg.duration)}`
                    : ''}
                </div>
              )}

              {/* The stop itself */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    flex: '0 0 auto',
                    width: 28,
                    height: 28,
                    borderRadius: '9999px',
                    background: ROLE_COLOR[role],
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ paddingTop: 3 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
                    {stop.name.split(',')[0]}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {stop.name.split(',').slice(1).join(',').trim()}
                  </div>
                  {stop.arrivalDate && (
                    <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>
                      Arrives {stop.arrivalDate}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Footer total */}
      {routeInfo && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <span>Total</span>
          <span>
            {formatDistance(routeInfo.totalDistance)} ·{' '}
            {formatDuration(routeInfo.totalDuration)}
          </span>
        </div>
      )}
    </div>
  );
});

export default TripSummaryCard;
