import { describe, expect, it } from 'vitest';
import { seedConfig } from '../../data/seedConfig';
import { syncHotelNightsFromStops } from './helpers';

describe('syncHotelNightsFromStops', () => {
  it('adds hotel rows for new stops without removing existing rows', () => {
    const existing = [
      { destinationId: 'skardu', categoryId: 'deluxe', hotelId: 'maple-skardu', rooms: 1, nights: 3 },
    ];

    const next = syncHotelNightsFromStops(['skardu', 'hunza'], 8, existing, seedConfig);

    expect(next).toHaveLength(2);
    expect(next[0]).toEqual(existing[0]);
    expect(next[1]?.destinationId).toBe('hunza');
    expect(next[1]?.categoryId).toBe('deluxe');
    expect(next[1]?.rooms).toBe(1);
    expect(next[1]?.nights).toBeGreaterThan(0);
  });

  it('returns unchanged list when all stops already have hotel rows', () => {
    const existing = [
      { destinationId: 'skardu', categoryId: 'deluxe', hotelId: '', rooms: 1, nights: 3 },
      { destinationId: 'hunza', categoryId: 'deluxe', hotelId: '', rooms: 1, nights: 3 },
    ];

    const next = syncHotelNightsFromStops(['skardu', 'hunza'], 8, existing, seedConfig);
    expect(next).toEqual(existing);
  });
});
