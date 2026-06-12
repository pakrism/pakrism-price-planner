import { ceilFuelPrice } from '../pricing/fuelCost';
import type { FuelConfig } from '../pricing/types';

export interface FuelFetchResult {
  pricePerLiter: number;
  source: 'fetch' | 'manual';
  lastUpdated: string;
  warning?: string;
}

export async function fetchFuelPrice(config: FuelConfig): Promise<FuelFetchResult> {
  const fallback = {
    pricePerLiter: ceilFuelPrice(config.manualPricePerLiter),
    source: 'manual' as const,
    lastUpdated: config.lastUpdated ?? new Date().toISOString(),
    warning: 'Using manual fuel price',
  };

  if (!config.fetchUrl) return fallback;

  try {
    const res = await fetch(config.fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw =
      config.fuelType === 'diesel'
        ? Number(data.diesel ?? data.price)
        : Number(data.petrol ?? data.price);
    if (!Number.isFinite(raw) || raw <= 0) throw new Error('Invalid price');
    return {
      pricePerLiter: ceilFuelPrice(raw),
      source: 'fetch',
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return { ...fallback, warning: 'Fetch failed — using manual fuel price' };
  }
}
