import type { AppConfig, VehicleType } from './types';

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
