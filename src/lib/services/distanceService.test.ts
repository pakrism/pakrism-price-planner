import { describe, expect, it, vi, afterEach } from 'vitest';
import { seedConfig } from '../../data/seedConfig';
import { resolveTripDistance } from './distanceService';
import * as googleDirections from './googleDirections';

describe('resolveTripDistance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses Google distances when proxy succeeds', async () => {
    vi.spyOn(googleDirections, 'resolveDistanceWithGoogle').mockResolvedValue({
      outbound: {
        km: 500,
        legs: [{ from: 'Islamabad', to: 'Skardu', km: 500 }],
        source: 'google',
      },
      returnTrip: {
        km: 500,
        legs: [{ from: 'Skardu', to: 'Islamabad', km: 500 }],
        source: 'google',
      },
    });

    const result = await resolveTripDistance('islamabad', ['skardu'], 75, seedConfig);

    expect(result.source).toBe('google');
    expect(result.outboundKm).toBe(500);
    expect(result.returnKm).toBe(500);
    expect(result.totalKm).toBe(1075);
    expect(result.missingLegs).toBeUndefined();
  });

  it('falls back to manual matrix when Google is unavailable', async () => {
    vi.spyOn(googleDirections, 'resolveDistanceWithGoogle').mockResolvedValue(null);

    const result = await resolveTripDistance('islamabad', ['skardu'], 75, seedConfig);

    expect(result.source).toBe('manual');
    expect(result.outboundKm).toBeGreaterThan(0);
    expect(result.missingLegs).toBeUndefined();
  });
});
