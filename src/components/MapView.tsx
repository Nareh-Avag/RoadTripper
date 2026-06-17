import { useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  Popup,
  Source,
  Layer,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import { useTripStore } from '../store';
import { roleForIndex, ROLE_COLOR } from '../types';
import { routeLine } from '../lib/route';

// Carto Voyager basemap as a raster style — free, no API key required.
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    { id: 'carto-voyager', type: 'raster', source: 'carto-voyager' },
  ],
};

export default function MapView() {
  const stops = useTripStore((s) => s.stops);
  const selectStop = useTripStore((s) => s.selectStop);
  const mapRef = useRef<MapRef>(null);
  const [popupId, setPopupId] = useState<string | null>(null);

  // The dashed route line connecting stops in order (built with Turf).
  const route = useMemo(() => routeLine(stops), [stops]);

  // Fit the map to all stops whenever the set of coordinates changes.
  const boundsKey = stops.map((s) => s.coordinates.join(',')).join('|');
  useEffect(() => {
    const map = mapRef.current;
    if (!map || stops.length === 0) return;

    if (stops.length === 1) {
      map.easeTo({ center: stops[0].coordinates, zoom: 9, duration: 600 });
      return;
    }

    // Compute a bounding box across all stops.
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    for (const s of stops) {
      const [lng, lat] = s.coordinates;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, duration: 600, maxZoom: 12 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey]);

  const popupStop = stops.find((s) => s.id === popupId) ?? null;

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: -98.5, latitude: 39.8, zoom: 3 }}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />

      {/* Dashed route line connecting the stops in order. */}
      <Source id="route" type="geojson" data={route}>
        <Layer
          id="route-line"
          type="line"
          paint={{
            'line-color': '#333',
            'line-width': 2,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>

      {/* Numbered, role-colored markers. */}
      {stops.map((stop, i) => {
        const role = roleForIndex(i, stops.length);
        return (
          <Marker
            key={stop.id}
            longitude={stop.coordinates[0]}
            latitude={stop.coordinates[1]}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupId(stop.id);
            }}
          >
            {/* Plain numbered circle marker; color encodes role. */}
            <div
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border text-xs text-white"
              style={{ backgroundColor: ROLE_COLOR[role] }}
              title={stop.name}
            >
              {i + 1}
            </div>
          </Marker>
        );
      })}

      {popupStop && (
        <Popup
          longitude={popupStop.coordinates[0]}
          latitude={popupStop.coordinates[1]}
          anchor="bottom"
          onClose={() => setPopupId(null)}
          closeOnClick={false}
        >
          <div className="space-y-1">
            <div className="text-sm">{popupStop.name}</div>
            <button
              type="button"
              className="border px-2 py-1 text-sm"
              onClick={() => {
                selectStop(popupStop.id);
                setPopupId(null);
              }}
            >
              Open details
            </button>
          </div>
        </Popup>
      )}
    </Map>
  );
}
