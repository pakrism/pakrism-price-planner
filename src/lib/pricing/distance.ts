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

function resolveCityId(key: string, cities: City[]): string {
  if (cities.some((city) => city.id === key)) return key;
  const byName = cities.find((city) => city.name === key);
  return byName?.id ?? key;
}

function buildDistanceGraph(matrix: DistanceLeg[], cities: City[]): Map<string, Map<string, number>> {
  const graph = new Map<string, Map<string, number>>();

  function addEdge(from: string, to: string, km: number) {
    if (!graph.has(from)) graph.set(from, new Map());
    const edges = graph.get(from)!;
    const existing = edges.get(to);
    if (existing == null || km < existing) {
      edges.set(to, km);
    }
  }

  matrix.forEach((leg) => {
    const from = resolveCityId(leg.from, cities);
    const to = resolveCityId(leg.to, cities);
    addEdge(from, to, leg.km);
    addEdge(to, from, leg.km);
  });

  return graph;
}

function shortestPathKm(
  fromId: string,
  toId: string,
  graph: Map<string, Map<string, number>>,
): number | null {
  if (fromId === toId) return 0;

  const distances = new Map<string, number>([[fromId, 0]]);
  const visited = new Set<string>();
  const queue = [fromId];

  while (queue.length > 0) {
    queue.sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity));
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === toId) return distances.get(toId) ?? null;

    const edges = graph.get(current);
    if (!edges) continue;

    edges.forEach((km, next) => {
      const nextDistance = (distances.get(current) ?? Infinity) + km;
      if (nextDistance < (distances.get(next) ?? Infinity)) {
        distances.set(next, nextDistance);
        if (!visited.has(next)) queue.push(next);
      }
    });
  }

  return distances.has(toId) ? distances.get(toId)! : null;
}

function lookupLegKm(
  fromId: string,
  toId: string,
  matrix: DistanceLeg[],
  cities: City[],
): number | null {
  const from = resolveCityId(fromId, cities);
  const to = resolveCityId(toId, cities);

  const direct = matrix.find(
    (leg) =>
      (leg.from === from && leg.to === to) ||
      (leg.from === to && leg.to === from) ||
      (leg.from === fromId && leg.to === toId) ||
      (leg.from === toId && leg.to === fromId),
  );
  if (direct) return direct.km;

  const fromCity = cities.find((c) => c.id === from)?.name ?? from;
  const toCity = cities.find((c) => c.id === to)?.name ?? to;
  const byNameDirect = matrix.find(
    (leg) =>
      (leg.from === fromCity && leg.to === toCity) ||
      (leg.from === toCity && leg.to === fromCity),
  );
  if (byNameDirect) return byNameDirect.km;

  const graph = buildDistanceGraph(matrix, cities);
  return shortestPathKm(from, to, graph);
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
