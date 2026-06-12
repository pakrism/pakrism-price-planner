export type DistanceSource = 'google' | 'manual';

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  name: string;
  avgKmPerLiter: number;
  perDayRent: number;
  capacity: number;
}

export interface DistanceLeg {
  from: string;
  to: string;
  km: number;
}

export interface HotelCategory {
  id: string;
  name: string;
  defaultPricePerNight: number;
  destinationOverrides: Record<string, number>;
}

export interface EntryTicket {
  id: string;
  name: string;
  price: number;
  destination?: string;
}

export interface ProvisionsConfig {
  driverPerDay: number;
  tolls: number;
  taxPercent: number;
  defaultBufferKm: number;
  defaultMarginPercent: number;
}

export interface FuelConfig {
  fuelType: 'petrol' | 'diesel';
  manualPricePerLiter: number;
  fetchUrl?: string;
  lastUpdated?: string;
}

export interface AppConfig {
  vehicles: Vehicle[];
  cities: City[];
  distanceLegs: DistanceLeg[];
  hotelCategories: HotelCategory[];
  entryTickets: EntryTicket[];
  provisions: ProvisionsConfig;
  fuel: FuelConfig;
}

export interface HotelNightInput {
  destinationId: string;
  categoryId: string;
  nights: number;
}

export interface TicketSelection {
  ticketId: string;
  quantity: number;
}

export interface CalculationInput {
  departureCityId: string;
  waypointIds: string[];
  vehicleId: string;
  tripDays: number;
  hotelNights: HotelNightInput[];
  tickets: TicketSelection[];
  pax: number;
  marginPercent: number;
  bufferKm?: number;
  fuelPriceOverride?: number;
  tollsOverride?: number;
}

export interface DistanceResult {
  outboundKm: number;
  returnKm: number;
  bufferKm: number;
  totalKm: number;
  source: DistanceSource;
  legs: Array<{ from: string; to: string; km: number }>;
  missingLegs?: string[];
}

export interface PriceBreakdown {
  distance: DistanceResult;
  fuel: {
    avgKmPerLiter: number;
    pricePerLiter: number;
    liters: number;
    cost: number;
  };
  vehicleRent: { days: number; perDay: number; cost: number };
  provisions: { driver: number; tolls: number; tax: number; total: number };
  hotels: {
    lineItems: Array<{
      destination: string;
      category: string;
      nights: number;
      pricePerNight: number;
      cost: number;
    }>;
    total: number;
  };
  tickets: {
    lineItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
    total: number;
  };
  subtotal: number;
  margin: { percent: number; amount: number };
  totalWithMargin: number;
  pricePerPerson: number;
}
