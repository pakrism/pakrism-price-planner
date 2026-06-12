import { describe, expect, it } from 'vitest';
import { seedConfig } from '../../data/seedConfig';
import { calculatePackagePrice } from './calculatePackagePrice';
import { calculateManualDistance } from './distance';

describe('calculatePackagePrice', () => {
  it('applies margin and divides by pax', () => {
    const distance = calculateManualDistance(
      'islamabad',
      ['skardu'],
      75,
      seedConfig.distanceLegs,
      seedConfig.cities,
    );

    const result = calculatePackagePrice(
      {
        departureCityId: 'islamabad',
        waypointIds: ['skardu'],
        vehicleId: 'brv',
        tripDays: 7,
        hotelNights: [{ destinationId: 'skardu', categoryId: 'deluxe', nights: 3 }],
        tickets: [{ ticketId: 'shangrila', quantity: 4 }],
        pax: 4,
        marginPercent: 15,
      },
      seedConfig,
      distance,
    );

    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.margin.percent).toBe(15);
    expect(result.totalWithMargin).toBeCloseTo(result.subtotal * 1.15, 0);
    expect(result.pricePerPerson).toBeCloseTo(result.totalWithMargin / 4, 0);
  });
});
