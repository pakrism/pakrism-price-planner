import { describe, expect, it } from 'vitest';
import { calculateFuelCost, calculateFuelLiters, ceilFuelPrice } from './fuelCost';

describe('fuelCost', () => {
  it('ceilings fuel price', () => {
    expect(ceilFuelPrice(279.2)).toBe(280);
    expect(ceilFuelPrice(280)).toBe(280);
  });

  it('calculates liters from distance and average', () => {
    expect(calculateFuelLiters(2000, 11)).toBeCloseTo(181.818, 2);
  });

  it('calculates fuel cost for BRV example', () => {
    const result = calculateFuelCost(2000, 11, 279.2);
    expect(result.pricePerLiter).toBe(280);
    expect(result.liters).toBeCloseTo(181.818, 2);
    expect(result.cost).toBeCloseTo(50909.09, 0);
  });
});
