import type { AppConfig } from '../lib/pricing/types';

export const seedConfig: AppConfig = {
  vehicles: [
    { id: 'brv', name: 'BRV', avgKmPerLiter: 11, perDayRent: 18000, capacity: 6 },
    { id: 'hiace', name: 'Toyota Hiace', avgKmPerLiter: 9, perDayRent: 15000, capacity: 12 },
    { id: 'coaster', name: 'Toyota Coaster', avgKmPerLiter: 6, perDayRent: 28000, capacity: 25 },
  ],
  cities: [
    { id: 'islamabad', name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
    { id: 'abbottabad', name: 'Abbottabad', lat: 34.1688, lng: 73.2215 },
    { id: 'naran', name: 'Naran', lat: 34.9039, lng: 73.6501 },
    { id: 'chilas', name: 'Chilas', lat: 35.4206, lng: 74.0953 },
    { id: 'gilgit', name: 'Gilgit', lat: 35.9208, lng: 74.3144 },
    { id: 'hunza', name: 'Hunza', lat: 36.3167, lng: 74.65 },
    { id: 'skardu', name: 'Skardu', lat: 35.2971, lng: 75.6334 },
    { id: 'khunjerab', name: 'Khunjerab Pass', lat: 36.85, lng: 75.4167 },
  ],
  distanceLegs: [
    { from: 'islamabad', to: 'abbottabad', km: 120 },
    { from: 'abbottabad', to: 'naran', km: 110 },
    { from: 'naran', to: 'chilas', km: 130 },
    { from: 'chilas', to: 'gilgit', km: 130 },
    { from: 'gilgit', to: 'hunza', km: 100 },
    { from: 'hunza', to: 'khunjerab', km: 120 },
    { from: 'gilgit', to: 'skardu', km: 170 },
    { from: 'islamabad', to: 'gilgit', km: 600 },
    { from: 'islamabad', to: 'skardu', km: 630 },
    { from: 'skardu', to: 'khunjerab', km: 290 },
  ],
  hotelCategories: [
    {
      id: 'deluxe',
      name: 'Deluxe',
      defaultPricePerNight: 12000,
      destinationOverrides: { Skardu: 14000, Hunza: 15000, Gilgit: 11000 },
    },
    {
      id: 'executive',
      name: 'Executive',
      defaultPricePerNight: 18000,
      destinationOverrides: { Skardu: 22000, Hunza: 24000, Gilgit: 16000 },
    },
  ],
  entryTickets: [
    { id: 'altit', name: 'Altit Fort', price: 1200, destination: 'Hunza' },
    { id: 'baltit', name: 'Baltit Fort', price: 1200, destination: 'Hunza' },
    { id: 'shangrila', name: 'Shangrila Resort', price: 1500, destination: 'Skardu' },
    { id: 'upper-kachura', name: 'Upper Kachura Lake', price: 500, destination: 'Skardu' },
    { id: 'deosai', name: 'Deosai National Park', price: 2500, destination: 'Skardu' },
  ],
  provisions: {
    driverPerDay: 5000,
    tolls: 8000,
    taxPercent: 0,
    defaultBufferKm: 75,
    defaultMarginPercent: 15,
  },
  fuel: {
    fuelType: 'petrol',
    manualPricePerLiter: 280,
    fetchUrl: '',
    lastUpdated: new Date().toISOString(),
  },
};
