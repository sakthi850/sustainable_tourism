# Wayfinder data seed update

This version keeps the original Sathyamangalam seed records and adds a separate Coimbatore seed set.

## Seed totals
- Tourist places: 30 Sathyamangalam + 11 Coimbatore = 41
- Businesses: 33 original + 11 Coimbatore = 44
- Accommodation: 2 original + 6 Coimbatore = 8
- Food: 23 original + 5 Coimbatore = 28
- Other businesses: 8 original

The added Coimbatore records use public map/government/directory sources for coordinates. Ratings, hours, prices, sustainability, phone numbers and websites are left unknown unless independently verified in the seed source.

## How to use
From `wayfinder-backend`:

```powershell
npm install
npm run typecheck
npm run seed
npm run dev
```

The seed is duplicate-safe. With the previous database containing 30 places and 33 businesses, the new records should insert approximately 11 places and 11 businesses and skip the existing records.

## Important
- Do not copy or commit a real `.env` file.
- Recreate `.env` locally from `.env.example`.
- The API/live-discovery providers remain optional. The seeded MongoDB records provide the offline fallback dataset.
