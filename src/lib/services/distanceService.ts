import { calculateManualDistance, mergeDistanceResults } from '../pricing/distance';
import type { AppConfig, DistanceResult } from '../pricing/types';
import { resolveDistanceWithGoogle } from './googleDirections';

export async function resolveTripDistance(
  departureCityId: string,
  waypointIds: string[],
  bufferKm: number,
  config: AppConfig,
): Promise<DistanceResult> {
  const google = await resolveDistanceWithGoogle(
    departureCityId,
    waypointIds,
    bufferKm,
    config.cities,
  );

  if (google) {
    return mergeDistanceResults(google.outbound, google.returnTrip, bufferKm);
  }

  return calculateManualDistance(
    departureCityId,
    waypointIds,
    bufferKm,
    config.distanceLegs,
    config.cities,
  );
}
