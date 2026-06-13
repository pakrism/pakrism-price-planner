import type { AppConfig, CalculationInput, PriceBreakdown, QuoteMode } from '../pricing/types';
import { formatPkr } from '../../utils/format';

interface QuoteInput {
  packageTitle: string;
  tripDays: number;
  pax: number;
  quoteMode: QuoteMode;
  breakdown: PriceBreakdown;
  vehicleName: string;
  hotelNames: string[];
  hotelCategoryLabel: string;
  config: AppConfig;
}

export function generateCustomerQuote(input: QuoteInput): string {
  const nights = Math.max(input.tripDays - 1, 1);
  const price =
    input.quoteMode === 'family'
      ? input.breakdown.totalWithMargin
      : input.breakdown.pricePerPerson;
  const priceLine =
    input.quoteMode === 'family'
      ? `👫 *${formatPkr(price)}* for a family of ${input.pax}`
      : `👫 *${formatPkr(price)}* per person (${input.pax} pax)`;

  const inclusions = input.config.quoteSettings.inclusions.map((line) => {
    if (line.toLowerCase().includes('transport')) {
      return `✅ ${line} - ${input.vehicleName}`;
    }
    if (line.toLowerCase().includes('hotel')) {
      return `✅ ${input.hotelCategoryLabel} Hotel Accommodation`;
    }
    return `✅ ${line}`;
  });

  const exclusions = input.config.quoteSettings.exclusions.map((line) => `❌ ${line}`);

  const hotelSection =
    input.hotelNames.length > 0
      ? [
          `*${input.hotelCategoryLabel} Hotels*`,
          '(1 standard category room per night)',
          ...input.hotelNames.map((name) => `- ${name}`),
        ].join('\n')
      : '';

  return [
    `*${input.packageTitle}*`,
    '',
    `🗓️ ${input.tripDays} Days & ${nights} Nights`,
    priceLine,
    `🚀 Departs: ${input.config.quoteSettings.departureLine}`,
    '',
    '𝐈𝐧𝐜𝐥𝐮𝐝𝐞𝐬 𝐢𝐧 𝐏𝐚𝐜𝐤𝐚𝐠𝐞',
    ...inclusions,
    '',
    hotelSection,
    '',
    '𝐍𝐨𝐭 𝐈𝐧𝐜𝐥𝐮𝐝𝐞 𝐢𝐧 𝐏𝐚𝐜𝐤𝐚𝐠𝐞',
    ...exclusions,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildQuoteFromCalculation(
  input: CalculationInput,
  breakdown: PriceBreakdown,
  config: AppConfig,
): string {
  const vehicle = config.vehicles.find((v) => v.id === input.vehicleId);
  const hotelNames = input.hotelNights
    .map((night) => {
      if (night.hotelId) {
        return config.hotels.find((h) => h.id === night.hotelId)?.name;
      }
      const cat = config.hotelCategories.find((c) => c.id === night.categoryId);
      const city = config.cities.find((c) => c.id === night.destinationId);
      return cat && city ? `${cat.name} stay in ${city.name}` : undefined;
    })
    .filter((name): name is string => Boolean(name));

  const primaryCategory =
    config.hotelCategories.find((c) => c.id === input.hotelNights[0]?.categoryId)?.name ??
    'Deluxe';

  return generateCustomerQuote({
    packageTitle: input.packageTitle || 'Northern Pakistan Tour',
    tripDays: input.tripDays,
    pax: input.pax,
    quoteMode: input.quoteMode ?? 'family',
    breakdown,
    vehicleName: vehicle?.name ?? 'Private Vehicle',
    hotelNames,
    hotelCategoryLabel: primaryCategory,
    config,
  });
}
