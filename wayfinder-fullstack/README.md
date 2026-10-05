# Wayfinder / S-CADE

Wayfinder is a full-stack context-aware tourism and local-business discovery system. Browser GPS, live OpenStreetMap places from Overpass, curated MongoDB listings, saved user preferences, and current Open-Meteo conditions feed a nine-factor S-CADE ranking engine. Results include human-readable explanations rather than mathematical formulas.

## Architecture

- `wayfinder-frontend`: React, TypeScript, Vite, React Router and Leaflet.
- `wayfinder-backend`: Express, TypeScript, Mongoose, JWT and bcrypt.
- MongoDB stores users, preferences, platform places/businesses, favorites, reviews, itineraries and recommendation feedback.
- OpenStreetMap discoveries remain transient and explicitly show unknown rating/sustainability data.
- Open-Meteo weather context is fetched server-side with graceful fallback.
- OSRM supplies in-app driving route geometry, distance and duration; Google Maps is retained as fallback.

## Features

Authentication and roles, personalized recommendations, tourist places, local businesses, sustainability filters, typed place/business reviews, helpful voting, favorites, saved itineraries, Hidden Gems, Leaflet maps, routing, camera-assisted AR direction with 2D fallback, feedback voting and protected admin CRUD/verification are implemented.

## Setup

Backend (PowerShell):

```powershell
cd wayfinder-backend
npm install
Copy-Item .env.example .env
# Fill MONGODB_URI and JWT_SECRET in .env; Overpass needs no API key
npm run dev
```

Frontend, in a second terminal:

```powershell
cd wayfinder-frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Backend health is available at `http://localhost:5000/api/health`.

## Verification

```powershell
cd wayfinder-backend
npm run typecheck
npm test
npm run build

cd ../wayfinder-frontend
npm run typecheck
npm run build
```

## Security

`.env` and `.env.*` are ignored; only `.env.example` may be shared. Never put MongoDB, JWT or Geoapify secrets in React. Rotate any credentials that were previously included in a shared artifact.

## Known limitations

- Live-place quality depends on OpenStreetMap coverage and public Overpass availability.
- OSRM demo-service availability is not guaranteed; Google Maps is the fallback.
- Camera and device-orientation APIs vary by browser and generally require HTTPS and a physical device.
- Live discoveries are transient, so they cannot be favorited, reviewed or saved into persistent itineraries.
- Automated tests cover services, validation and authorization; full browser/device interaction still requires manual testing.
