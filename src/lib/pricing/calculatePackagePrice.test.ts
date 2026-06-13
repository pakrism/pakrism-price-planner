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
        hotelNights: [{ destinationId: 'skardu', categoryId: 'deluxe', rooms: 1, nights: 3 }],
        jeepSegments: [],
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

  it('charges hotels as rooms × nights × rate', () => {
    const distance = calculateManualDistance(
      'islamabad',
      ['skardu'],
      0,
      seedConfig.distanceLegs,
      seedConfig.cities,
    );

    const result = calculatePackagePrice(
      {
        departureCityId: 'islamabad',
        waypointIds: ['skardu'],
        vehicleId: 'brv',
        tripDays: 5,
        hotelNights: [
          {
            destinationId: 'skardu',
            categoryId: 'deluxe',
            hotelId: 'maple-skardu',
            rooms: 2,
            nights: 3,
          },
        ],
        jeepSegments: [],
        tickets: [],
        pax: 4,
        marginPercent: 0,
      },
      seedConfig,
      distance,
    );

    expect(result.hotels.lineItems[0]).toMatchObject({
      hotelName: 'Maple Resort',
      rooms: 2,
      nights: 3,
      pricePerRoomPerNight: 14000,
      cost: 84000,
    });
    expect(result.hotels.total).toBe(84000);
  });

  it('charges jeep segments as quantity × days × pricePerJeep', () => {
    const distance = calculateManualDistance(
      'islamabad',
      ['deosai'],
      0,
      seedConfig.distanceLegs,
      seedConfig.cities,
    );

    const result = calculatePackagePrice(
      {
        departureCityId: 'islamabad',
        waypointIds: ['deosai'],
        vehicleId: 'brv',
        tripDays: 6,
        hotelNights: [],
        jeepSegments: [{ segmentId: 'deosai-jeep', quantity: 2, days: 1 }],
        tickets: [],
        pax: 8,
        marginPercent: 0,
      },
      seedConfig,
      distance,
    );

    expect(result.jeeps.lineItems[0]).toMatchObject({
      name: 'Deosai Plateau Jeep',
      quantity: 2,
      days: 1,
      pricePerJeep: 25000,
      cost: 50000,
    });
    expect(result.jeeps.total).toBe(50000);
  });
});
