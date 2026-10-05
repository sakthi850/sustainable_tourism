# Wayfinder Backend

Express + TypeScript API backed by MongoDB/Mongoose. It provides JWT authentication, USER/ADMIN authorization, platform place/business CRUD, transient OpenStreetMap/Overpass discovery, nine-factor S-CADE ranking, Open-Meteo context, OSRM routing, preferences, favorites, typed reviews, itineraries and feedback.

```powershell
npm install
Copy-Item .env.example .env
# Fill placeholder values only in your local .env
npm run dev
```

Optional sample data:

```powershell
npm run seed
```

Verification:

```powershell
npm run typecheck
npm test
npm run build
```

Never commit `.env`. Overpass and weather failures degrade gracefully; MongoDB is required for persisted application features.
