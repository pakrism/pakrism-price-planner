import { useEffect, useMemo, useState } from 'react';
import { buildLegSequence, getRoundTripCityIds } from '../pricing/distance';
import { calculateFuelCost } from '../pricing/fuelCost';
import type { AppConfig, DistanceResult } from '../pricing/types';
import { resolveTripDistance } from '../services/distanceService';

export interface FuelPreview {
  liters: number;
  pricePerLiter: number;
  cost: number;
}

export function useTripDistance(
  departureCityId: string,
  waypointIds: string[],
  config: AppConfig,
  vehicleId: string,
) {
  const [distance, setDistance] = useState<DistanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waypointKey = waypointIds.join(',');

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await resolveTripDistance(
          departureCityId,
          waypointIds,
          config.provisions.defaultBufferKm,
          config,
        );

        if (cancelled) return;

        if (result.missingLegs?.length) {
          setError(`Missing distance data for: ${result.missingLegs.join(', ')}`);
        }

        setDistance(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Distance lookup failed');
          setDistance(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [departureCityId, waypointKey, config]);

  const vehicle = config.vehicles.find((v) => v.id === vehicleId);

  const fuelPreview: FuelPreview | null = useMemo(() => {
    if (!distance || !vehicle) return null;
    return calculateFuelCost(distance.totalKm, vehicle.avgKmPerLiter, config.fuel.manualPricePerLiter);
  }, [distance, vehicle, config.fuel.manualPricePerLiter]);

  const outboundLegs = useMemo(() => {
    if (!distance) return [];

    const { outbound } = getRoundTripCityIds(departureCityId, waypointIds);
    return buildLegSequence(outbound).map(([fromId, toId]) => {
      const from = config.cities.find((city) => city.id === fromId)?.name ?? fromId;
      const to = config.cities.find((city) => city.id === toId)?.name ?? toId;
      const leg = distance.legs.find((item) => item.from === from && item.to === to);
      return leg ?? { from, to, km: 0 };
    });
  }, [distance, departureCityId, waypointIds, config.cities]);

  return { distance, fuelPreview, outboundLegs, loading, error };
}
