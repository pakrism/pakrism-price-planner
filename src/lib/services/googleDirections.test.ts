import { describe, expect, it, vi, afterEach } from 'vitest';
import { seedConfig } from '../../data/seedConfig';
import { resolveDistanceWithGoogle } from './googleDirections';

describe('resolveDistanceWithGoogle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed outbound and return distances from Netlify proxy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          source: 'google',
          routes: [
            {
              km: 630,
              legs: [{ from: 'Islamabad', to: 'Skardu', km: 630 }],
            },
            {
              km: 630,
              legs: [{ from: 'Skardu', to: 'Islamabad', km: 630 }],
            },
          ],
        }),
      }),
    );

    const result = await resolveDistanceWithGoogle('islamabad', ['skardu'], 75, seedConfig.cities);

    expect(result).not.toBeNull();
    expect(result?.outbound.km).toBe(630);
    expect(result?.returnTrip.km).toBe(630);
    expect(result?.outbound.source).toBe('google');
    expect(result?.outbound.legs).toEqual([{ from: 'Islamabad', to: 'Skardu', km: 630 }]);
  });

  it('returns null when proxy is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: 'GOOGLE_MAPS_API_KEY is not configured' } }),
      }),
    );

    const result = await resolveDistanceWithGoogle('islamabad', ['skardu'], 75, seedConfig.cities);
    expect(result).toBeNull();
  });
});
