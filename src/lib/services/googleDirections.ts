import type { City, DistanceResult } from '../pricing/types';
import { getRoundTripCityIds } from '../pricing/distance';

interface RouteLegResult {
  km: number;
  legs: DistanceResult['legs'];
  source: DistanceResult['source'];
}

/**
 * Google Directions REST API cannot be called from the browser (CORS).
 * Distance is resolved via the manual matrix with multi-hop routing instead.
 * A server-side proxy could be added later if live Google distances are needed.
 */
export async function resolveDistanceWithGoogle(
  departureCityId: string,
  waypointIds: string[],
  _bufferKm: number,
  _cities: City[],
): Promise<{ outbound: RouteLegResult; returnTrip: RouteLegResult } | null> {
  void departureCityId;
  void waypointIds;
  void getRoundTripCityIds;
  return null;
}
