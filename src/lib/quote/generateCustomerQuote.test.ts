import { describe, expect, it } from 'vitest';
import { seedConfig } from '../../data/seedConfig';
import { calculatePackagePrice } from '../pricing/calculatePackagePrice';
import { calculateManualDistance } from '../pricing/distance';
import { buildQuoteFromCalculation, generateCustomerQuote } from './generateCustomerQuote';

describe('generateCustomerQuote', () => {
  it('formats a WhatsApp-style family quote with hotels and unicode headers', () => {
    const distance = calculateManualDistance(
      'islamabad',
      ['skardu', 'hunza'],
      75,
      seedConfig.distanceLegs,
      seedConfig.cities,
    );

    const input = {
      departureCityId: 'islamabad',
      waypointIds: ['skardu', 'hunza'],
      vehicleId: 'brv',
      tripDays: 8,
      hotelNights: [
        { destinationId: 'skardu', categoryId: 'deluxe', hotelId: 'maple-skardu', rooms: 1, nights: 3 },
        { destinationId: 'hunza', categoryId: 'deluxe', hotelId: 'hunza-elite', rooms: 1, nights: 3 },
      ],
      jeepSegments: [],
      tickets: [],
      pax: 5,
      marginPercent: 10,
      packageTitle: 'Skardu & Hunza Tour - Deluxe Plan',
      quoteMode: 'family' as const,
    };

    const breakdown = calculatePackagePrice(input, seedConfig, distance);
    const message = buildQuoteFromCalculation(input, breakdown, seedConfig);

    expect(message).toContain('*Skardu & Hunza Tour - Deluxe Plan*');
    expect(message).toContain('🗓️ 8 Days & 7 Nights');
    expect(message).toContain('for a family of 5');
    expect(message).toContain('BRV');
    expect(message).toContain('*Deluxe Hotels*');
    expect(message).toContain('- Maple Resort');
    expect(message).toContain('- Hunza Elite');
    expect(message).toContain('𝐈𝐧𝐜𝐥𝐮𝐝𝐞𝐬 𝐢𝐧 𝐏𝐚𝐜𝐤𝐚𝐠𝐞');
    expect(message).toContain('❌ Lunch and dinner');
  });

  it('uses per-person pricing when quote mode is perPerson', () => {
    const breakdown = {
      totalWithMargin: 500000,
      pricePerPerson: 100000,
    } as ReturnType<typeof calculatePackagePrice>;

    const message = generateCustomerQuote({
      packageTitle: 'Hunza Tour',
      tripDays: 5,
      pax: 5,
      quoteMode: 'perPerson',
      breakdown,
      vehicleName: 'BRV',
      hotelNames: ['Hunza Elite'],
      hotelCategoryLabel: 'Deluxe',
      config: seedConfig,
    });

    expect(message).toContain('per person (5 pax)');
    expect(message).toContain('PKR 100,000');
  });
});
