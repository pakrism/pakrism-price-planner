export type DistanceSource = 'google' | 'manual';
export type CityKind = 'departure' | 'stop' | 'both';
export type VehicleAccess = 'car' | 'van' | 'coaster' | 'jeep';
export type VehicleType = 'car' | 'van' | 'coaster' | 'grand-cabin';
export type QuoteMode = 'family' | 'perPerson';

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: CityKind;
  vehicleAccess: VehicleAccess[];
  region?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
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

export interface HotelProperty {
  id: string;
  name: string;
  cityId: string;
  categoryId: string;
  pricePerRoomPerNight: number;
}

export interface JeepSegment {
  id: string;
  name: string;
  cityId: string;
  pricePerJeep: number;
  capacity: number;
  defaultDays: number;
}

export interface EntryTicket {
  id: string;
  name: string;
  price: number;
  destination?: string;
}

export interface QuoteSettings {
  departureLine: string;
  inclusions: string[];
  exclusions: string[];
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
  hotels: HotelProperty[];
  jeepSegments: JeepSegment[];
  entryTickets: EntryTicket[];
  quoteSettings: QuoteSettings;
  provisions: ProvisionsConfig;
  fuel: FuelConfig;
}

export interface HotelNightInput {
  destinationId: string;
  categoryId: string;
  hotelId?: string;
  rooms: number;
  nights: number;
}

export interface JeepSegmentSelection {
  segmentId: string;
  quantity: number;
  days?: number;
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
  jeepSegments: JeepSegmentSelection[];
  tickets: TicketSelection[];
  pax: number;
  marginPercent: number;
  packageTitle?: string;
  quoteMode?: QuoteMode;
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
      hotelName: string;
      category: string;
      nights: number;
      rooms: number;
      pricePerRoomPerNight: number;
      cost: number;
    }>;
    total: number;
  };
  jeeps: {
    lineItems: Array<{
      name: string;
      quantity: number;
      days: number;
      pricePerJeep: number;
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

export interface ParsedRequirement {
  packageTitle?: string;
  departureCityId?: string;
  waypointIds?: string[];
  vehicleId?: string;
  tripDays?: number;
  adults?: number;
  children?: number;
  hotelNights?: HotelNightInput[];
  jeepSegments?: JeepSegmentSelection[];
  tickets?: TicketSelection[];
  marginPercent?: number;
  quoteMode?: QuoteMode;
  warnings?: string[];
}
