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

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` — pricing engine unit tests

## Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

Config is stored at `pricePlanner/config`.
