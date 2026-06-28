# Pakrism Price Planner

Internal road package cost calculator for Pakrism tours. Estimates fuel, vehicle rent, provisions, hotels, and entry tickets, then suggests a price per person with margin. Calculations are **not saved**.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Uses the same Firebase project as `pr-bookings-manager`. Sign in with your existing Pakrism team account (admin role required for settings).

## Features

- **Calculator** — build an itinerary, select vehicle/pax, get a full cost breakdown
- **Admin** — vehicles, cities, distance matrix, hotels, tickets, provisions, fuel
- **Fuel** — `distance ÷ km/L × ceil(fuel price)` with manual or fetched prices
- **Distance** — Google Maps Directions when API key is set; manual matrix fallback
- **Live preview** — distance and fuel update as you add itinerary stops

## Google Maps distance (optional)

For automatic road distances instead of maintaining the manual matrix:

1. Enable **Directions API** in [Google Cloud Console](https://console.cloud.google.com/)
2. Create an API key and restrict it to Directions API
3. In Netlify → Site settings → Environment variables, add `GOOGLE_MAPS_API_KEY` (server-only, not `VITE_*`)
4. Redeploy the site

Without the key, the calculator falls back to the admin distance matrix.

## AI parsing (disabled by default)

Set `VITE_ENABLE_AI_PARSING=true` in Netlify to re-enable the Parse with AI panel.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` — pricing engine unit tests

## Deploy Firestore rules (required for shared admin config)

See [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md). Deploy from **pr-bookings-manager**, not this repo:

```bash
cd ~/pr-bookings-manager
npx firebase-tools login
npm run deploy:rules
```

Config is stored at `pricePlanner/config`.
