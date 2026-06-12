export function ceilFuelPrice(pricePerLiter: number): number {
  return Math.ceil(pricePerLiter);
}

export function calculateFuelLiters(totalDistanceKm: number, avgKmPerLiter: number): number {
  if (avgKmPerLiter <= 0) return 0;
  return totalDistanceKm / avgKmPerLiter;
}

export function calculateFuelCost(
  totalDistanceKm: number,
  avgKmPerLiter: number,
  pricePerLiter: number,
): { liters: number; pricePerLiter: number; cost: number } {
  const liters = calculateFuelLiters(totalDistanceKm, avgKmPerLiter);
  const roundedPrice = ceilFuelPrice(pricePerLiter);
  const cost = liters * roundedPrice;
  return { liters, pricePerLiter: roundedPrice, cost };
}
