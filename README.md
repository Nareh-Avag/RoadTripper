# RoadTripper

https://road-tripper.vercel.app/
 
An interactive road-trip planner... Mostly built for myself. Search for places, drop them onto a map, drag to reorder your stops, and see the actual driving route along real roads — with total distance and drive time.
 
Built as a single-page web app with no backend: everything runs in the browser and your trip is saved locally.

## Tech stack
 
- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management (persisted to localStorage)
- **MapLibre GL** via `react-map-gl` for the map
- **Nominatim** (OpenStreetMap) for geocoding
- **OSRM** for road routing and route optimization
- **Turf** for geometry helpers
- **dnd-kit** for drag-and-drop reordering
No API keys are required — all map, geocoding, and routing services used are keyless public endpoints.
 
## Getting started
 
You'll need [Node.js](https://nodejs.org/) installed.
 
```bash
# install dependencies
npm install
 
# start the dev server
npm run dev
```
 
Then open the local URL shown in the terminal (usually `http://localhost:5173`).
 
## Building for production
 
```bash
npm run build
```
 
This outputs a static site to the `dist/` folder, which can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).
 
To preview the production build locally:
 
```bash
npm run preview
```
 
## Project structure
 
```
src/
  types.ts              # Stop data model; marker role is derived from list position
  store.ts              # Zustand store, persisted to localStorage
  App.tsx               # App shell: onboarding gate vs. map view
  lib/
    nominatim.ts        # Geocoder with rate-limit queue
    routing.ts          # OSRM road geometry + route optimization
    route.ts            # GeoJSON line helper
    format.ts           # Distance / duration formatting
  hooks/
    useRouteSync.ts     # Refetches the route when stops change
  components/
    PlaceSearch.tsx     # Debounced place autocomplete
    Onboarding.tsx      # First-run setup flow
    MapView.tsx         # Map, markers, route line
    StopCard.tsx        # Editable, draggable stop card
    Sidebar.tsx         # Stop list, add-a-stop, export/import
```
 
## Notes
 
- **Routing provider:** Road routing uses OSRM's public demo server, which is free and keyless but has fair-use limits and no uptime guarantee — fine for personal use and demos. All routing logic is isolated in `src/lib/routing.ts`, so you can point it at a self-hosted OSRM instance or a keyed provider by changing a single file.
- **Geocoding:** Nominatim has a usage policy of one request per second, which the app respects via a built-in request queue.
