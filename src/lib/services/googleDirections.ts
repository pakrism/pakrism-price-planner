import { getRoundTripCityIds } from '../pricing/distance';
import type { City, DistanceResult } from '../pricing/types';

interface RouteLegResult {
  km: number;
  legs: DistanceResult['legs'];
  source: DistanceResult['source'];
}

interface DirectionsRouteResponse {
  km: number;
  legs: DistanceResult['legs'];
}

interface DirectionsApiResponse {
  source: 'google';
  routes: DirectionsRouteResponse[];
}

export async function resolveDistanceWithGoogle(
  departureCityId: string,
  waypointIds: string[],
  _bufferKm: number,
  cities: City[],
): Promise<{ outbound: RouteLegResult; returnTrip: RouteLegResult } | null> {
  const { outbound, returnTrip } = getRoundTripCityIds(departureCityId, waypointIds);

  try {
    const res = await fetch('/.netlify/functions/google-directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routes: [{ cityIds: outbound }, { cityIds: returnTrip }],
        cities: cities.map((city) => ({
          id: city.id,
          name: city.name,
          lat: city.lat,
          lng: city.lng,
        })),
      }),
    });

    if (res.status === 404 || res.status === 503) {
      return null;
    }

    const payload = (await res.json()) as DirectionsApiResponse | { error?: { message?: string } };
    if (!res.ok || !('routes' in payload)) {
      return null;
    }

    const [outboundRoute, returnRoute] = payload.routes;
    if (!outboundRoute || !returnRoute) {
      return null;
    }

    return {
      outbound: { km: outboundRoute.km, legs: outboundRoute.legs, source: 'google' },
      returnTrip: { km: returnRoute.km, legs: returnRoute.legs, source: 'google' },
    };
  } catch {
    return null;
  }
}
