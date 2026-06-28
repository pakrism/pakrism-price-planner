import type { AppConfig, HotelNightInput, VehicleType } from './types';

export function vehicleTypeToAccess(type: VehicleType): string {
  if (type === 'grand-cabin') return 'van';
  return type;
}

export function getDepartureCities(config: AppConfig) {
  return config.cities.filter((c) => c.kind === 'departure' || c.kind === 'both');
}

export function getStopCities(config: AppConfig) {
  return config.cities.filter((c) => c.kind === 'stop' || c.kind === 'both');
}

export function getStopsForVehicle(config: AppConfig, vehicleType: VehicleType) {
  const access = vehicleTypeToAccess(vehicleType);
  return getStopCities(config).filter((city) => city.vehicleAccess.includes(access as never));
}

export function getJeepSegmentsForItinerary(config: AppConfig, waypointIds: string[]) {
  const citySet = new Set(waypointIds);
  return config.jeepSegments.filter((segment) => citySet.has(segment.cityId));
}

export function getHotelsForCity(config: AppConfig, cityId: string) {
  return config.hotels.filter((h) => h.cityId === cityId);
}

export function syncHotelNightsFromStops(
  waypointIds: string[],
  tripDays: number,
  hotelNights: HotelNightInput[],
  config: AppConfig,
): HotelNightInput[] {
  const existingDestinations = new Set(hotelNights.map((row) => row.destinationId));
  const newStops = waypointIds.filter((id) => !existingDestinations.has(id));
  if (newStops.length === 0) return hotelNights;

  const totalNights = Math.max(tripDays - 1, 1);
  const nightsPerStop = Math.max(Math.floor(totalNights / Math.max(waypointIds.length, 1)), 1);
  const defaultCategory =
    config.hotelCategories.find((category) => category.id === 'deluxe')?.id
    ?? config.hotelCategories[0]?.id
    ?? 'deluxe';

  const additions: HotelNightInput[] = newStops.map((destinationId) => ({
    destinationId,
    categoryId: defaultCategory,
    hotelId: '',
    rooms: 1,
    nights: nightsPerStop,
  }));

  return [...hotelNights, ...additions];
}
