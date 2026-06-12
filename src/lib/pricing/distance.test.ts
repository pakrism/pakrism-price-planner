import { describe, expect, it } from 'vitest';
import { seedConfig } from '../../data/seedConfig';
import { calculateManualDistance, getRoundTripCityIds } from './distance';

describe('distance', () => {
  it('builds round-trip city sequences', () => {
    const result = getRoundTripCityIds('islamabad', ['skardu', 'khunjerab']);
    expect(result.outbound).toEqual(['islamabad', 'skardu', 'khunjerab']);
    expect(result.returnTrip).toEqual(['khunjerab', 'skardu', 'islamabad']);
  });

  it('calculates manual round-trip with buffer', () => {
    const result = calculateManualDistance(
      'islamabad',
      ['skardu', 'khunjerab'],
      75,
      seedConfig.distanceLegs,
      seedConfig.cities,
    );
    expect(result.source).toBe('manual');
    expect(result.outboundKm).toBeGreaterThan(0);
    expect(result.returnKm).toBeGreaterThan(0);
    expect(result.totalKm).toBe(result.outboundKm + result.returnKm + 75);
    expect(result.missingLegs).toBeUndefined();
  });

  it('reports missing legs instead of underquoting', () => {
    const result = calculateManualDistance(
      'islamabad',
      ['naran'],
      75,
      [],
      seedConfig.cities,
    );
    expect(result.missingLegs?.length).toBeGreaterThan(0);
  });
});
