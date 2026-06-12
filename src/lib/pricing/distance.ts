import type { City, DistanceLeg, DistanceResult } from './types';

export function buildLegSequence(cityIds: string[]): Array<[string, string]> {
  const legs: Array<[string, string]> = [];
  for (let i = 0; i < cityIds.length - 1; i += 1) {
    legs.push([cityIds[i], cityIds[i + 1]]);
  }
  return legs;
}

export function getRoundTripCityIds(departureCityId: string, waypointIds: string[]): {
  outbound: string[];
  returnTrip: string[];
} {
  const outbound = [departureCityId, ...waypointIds];

  if (waypointIds.length === 0) {
    return { outbound: [departureCityId], returnTrip: [departureCityId] };
  }

  const lastStop = waypointIds[waypointIds.length - 1];
  const returnIds = [lastStop];
  for (let i = waypointIds.length - 2; i >= 0; i -= 1) {
    returnIds.push(waypointIds[i]);
  }
  returnIds.push(departureCityId);

  return { outbound, returnTrip: returnIds };
}

function lookupLegKm(
  fromId: string,
  toId: string,
  matrix: DistanceLeg[],
  cities: City[],
): number | null {
  const direct = matrix.find((leg) => leg.from === fromId && leg.to === toId);
  if (direct) return direct.km;

  const reverse = matrix.find((leg) => leg.from === toId && leg.to === fromId);
  if (reverse) return reverse.km;

  const fromCity = cities.find((c) => c.id === fromId)?.name ?? fromId;
  const toCity = cities.find((c) => c.id === toId)?.name ?? toId;
  const byNameDirect = matrix.find((leg) => leg.from === fromCity && leg.to === toCity);
  if (byNameDirect) return byNameDirect.km;

  const byNameReverse = matrix.find((leg) => leg.from === toCity && leg.to === fromCity);
  if (byNameReverse) return byNameReverse.km;

  return null;
}

export function calculateManualDistance(
  departureCityId: string,
  waypointIds: string[],
  bufferKm: number,
  matrix: DistanceLeg[],
  cities: City[],
): DistanceResult {
  const { outbound, returnTrip } = getRoundTripCityIds(departureCityId, waypointIds);
  const outboundLegs = buildLegSequence(outbound);
  const returnLegs = buildLegSequence(returnTrip);

  const legs: DistanceResult['legs'] = [];
  const missingLegs: string[] = [];
  let outboundKm = 0;
  let returnKm = 0;

  outboundLegs.forEach(([from, to]) => {
    const km = lookupLegKm(from, to, matrix, cities);
    const fromName = cities.find((c) => c.id === from)?.name ?? from;
    const toName = cities.find((c) => c.id === to)?.name ?? to;
    if (km == null) {
      missingLegs.push(`${fromName} → ${toName}`);
      return;
    }
    legs.push({ from: fromName, to: toName, km });
    outboundKm += km;
  });

  returnLegs.forEach(([from, to]) => {
    const km = lookupLegKm(from, to, matrix, cities);
    const fromName = cities.find((c) => c.id === from)?.name ?? from;
    const toName = cities.find((c) => c.id === to)?.name ?? to;
    if (km == null) {
      if (!missingLegs.includes(`${fromName} → ${toName}`)) {
        missingLegs.push(`${fromName} → ${toName}`);
      }
      return;
    }
    if (!legs.some((l) => l.from === fromName && l.to === toName)) {
      legs.push({ from: fromName, to: toName, km });
    }
    returnKm += km;
  });

  if (missingLegs.length > 0) {
    return {
      outboundKm,
      returnKm,
      bufferKm,
      totalKm: outboundKm + returnKm + bufferKm,
      source: 'manual',
      legs,
      missingLegs,
    };
  }

  return {
    outboundKm,
    returnKm,
    bufferKm,
    totalKm: outboundKm + returnKm + bufferKm,
    source: 'manual',
    legs,
  };
}

export function mergeDistanceResults(
  outbound: { km: number; legs: DistanceResult['legs']; source: DistanceResult['source'] },
  returnTrip: { km: number; legs: DistanceResult['legs']; source: DistanceResult['source'] },
  bufferKm: number,
): DistanceResult {
  return {
    outboundKm: outbound.km,
    returnKm: returnTrip.km,
    bufferKm,
    totalKm: outbound.km + returnTrip.km + bufferKm,
    source: outbound.source === 'google' || returnTrip.source === 'google' ? 'google' : 'manual',
    legs: [...outbound.legs, ...returnTrip.legs],
  };
}
