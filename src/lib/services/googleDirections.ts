import type { City, DistanceResult } from '../pricing/types';
import { buildLegSequence, getRoundTripCityIds } from '../pricing/distance';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

interface RouteLegResult {
  km: number;
  legs: DistanceResult['legs'];
  source: DistanceResult['source'];
}

async function fetchRouteKm(cityIds: string[], cities: City[]): Promise<RouteLegResult | null> {
  if (!GOOGLE_MAPS_KEY || cityIds.length < 2) return null;

  const points = cityIds
    .map((id) => cities.find((c) => c.id === id))
    .filter((c): c is City => Boolean(c));

  if (points.length < 2) return null;

  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const waypoints =
    points.length > 2
      ? points
          .slice(1, -1)
          .map((p) => `${p.lat},${p.lng}`)
          .join('|')
      : undefined;

  const params = new URLSearchParams({
    origin,
    destination,
    key: GOOGLE_MAPS_KEY,
    units: 'metric',
  });
  if (waypoints) params.set('waypoints', waypoints);

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
    );
    const data = await res.json();
    if (data.status !== 'OK' || !data.routes?.[0]?.legs) return null;

    const apiLegs = data.routes[0].legs as Array<{ distance: { value: number } }>;
    const legPairs = buildLegSequence(cityIds);
    const legs: DistanceResult['legs'] = legPairs.map(([fromId, toId], index) => ({
      from: cities.find((c) => c.id === fromId)?.name ?? fromId,
      to: cities.find((c) => c.id === toId)?.name ?? toId,
      km: Math.round((apiLegs[index]?.distance?.value ?? 0) / 1000),
    }));
    const km = legs.reduce((sum, leg) => sum + leg.km, 0);
    return { km, legs, source: 'google' };
  } catch {
    return null;
  }
}

export async function resolveDistanceWithGoogle(
  departureCityId: string,
  waypointIds: string[],
  _bufferKm: number,
  cities: City[],
): Promise<{ outbound: RouteLegResult; returnTrip: RouteLegResult } | null> {
  const { outbound, returnTrip } = getRoundTripCityIds(departureCityId, waypointIds);

  const [outboundResult, returnResult] = await Promise.all([
    fetchRouteKm(outbound, cities),
    returnTrip.length > 1 ? fetchRouteKm(returnTrip, cities) : Promise.resolve(null),
  ]);

  if (!outboundResult) return null;
  if (waypointIds.length > 0 && !returnResult) return null;

  return {
    outbound: outboundResult,
    returnTrip: returnResult ?? { km: 0, legs: [], source: 'google' },
  };
}
