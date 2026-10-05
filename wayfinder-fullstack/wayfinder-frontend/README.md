# Wayfinder Frontend

React + TypeScript + Vite UI for Home recommendations, Explore/search, platform details, weather context, maps and routes, AR navigation, Hidden Gems, preferences, favorites, reviews, itineraries, profile and protected admin management.

```powershell
npm install
npm run dev
npm run typecheck
npm run build
```

Development runs at `http://localhost:5173` and proxies `/api` to `http://localhost:5000`.

Browser GPS, camera and orientation require user permission. AR automatically exposes a 2D map fallback. Live OpenStreetMap discoveries are clearly marked and are not treated as persisted entities.
