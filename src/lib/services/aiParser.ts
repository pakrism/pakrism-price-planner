import { FirebaseError } from 'firebase/app';
import { httpsCallableFromURL } from 'firebase/functions';
import type { AppConfig, HotelNightInput, ParsedRequirement } from '../pricing/types';
import { seedConfig } from '../../data/seedConfig';
import { functions } from '../firebase';

export interface ParseResult {
  result: ParsedRequirement;
  source: 'ai' | 'local';
  error?: string;
}

const NETWORK_ERROR_HINT =
  'Cannot reach AI server (network/DNS). Try another network, disable ad blockers, or set DNS to 8.8.8.8.';

function getCallableUrls(): string[] {
  return [
    import.meta.env.VITE_PARSE_REQUIREMENT_URL,
    'https://parseclientrequirement-kuz6vb23eq-uc.a.run.app',
    'https://us-central1-pakrism-bookings.cloudfunctions.net/parseClientRequirement',
  ].filter((url): url is string => Boolean(url));
}

function findVehicleId(config: AppConfig, text: string): string | undefined {
  const lower = text.toLowerCase();
  return config.vehicles.find(
    (v) =>
      lower.includes(v.name.toLowerCase()) ||
      lower.includes(v.type.replace('-', ' ')),
  )?.id;
}

function pickCategoryId(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('executive') || lower.includes('5 star') || lower.includes('5-star') || lower.includes('luxury')) {
    return 'executive';
  }
  return 'deluxe';
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('err_name_not_resolved')
  );
}

function parseCallableError(err: unknown): string {
  if (isNetworkError(err)) {
    return NETWORK_ERROR_HINT;
  }

  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'functions/unauthenticated':
        return 'You must be signed in to use AI parsing.';
      case 'functions/permission-denied':
        return 'Your account is not active. Contact an admin.';
      case 'functions/unavailable':
      case 'functions/deadline-exceeded':
        return 'AI service is temporarily unavailable.';
      case 'functions/internal': {
        const detail = err.message.replace(/^internal:\s*/i, '').trim();
        if (!detail || detail.toLowerCase() === 'internal') {
          return NETWORK_ERROR_HINT;
        }
        return detail;
      }
      default:
        return err.message || 'AI parsing failed.';
    }
  }

  if (err instanceof Error) {
    if (err.message.toLowerCase() === 'internal') {
      return NETWORK_ERROR_HINT;
    }
    return err.message;
  }

  return 'AI parsing failed.';
}

/** Rule-based fallback when Cloud Function / OpenAI unavailable */
export function parseRequirementLocally(text: string, config: AppConfig): ParsedRequirement {
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  const daysMatch = text.match(/(\d+)\s*days?/i);
  const tripDays = daysMatch ? Number(daysMatch[1]) : 7;

  const paxMatch =
    text.match(/(\d+)\s*people/i) ??
    text.match(/(?:family of|for)\s*(\d+)/i) ??
    text.match(/(\d+)\s*(?:pax|persons?|adults?)/i);
  const adults = paxMatch ? Number(paxMatch[1]) : 4;

  const roomsMatch = text.match(/(\d+)\s*rooms?(?:\s*per\s*night)?/i);
  const rooms = roomsMatch ? Number(roomsMatch[1]) : 1;

  let departureCityId = config.cities.find((c) => c.kind === 'departure' || c.kind === 'both')?.id;
  for (const city of config.cities) {
    if (lower.includes(city.name.toLowerCase()) && (city.kind === 'departure' || city.kind === 'both')) {
      departureCityId = city.id;
      break;
    }
  }

  const waypointIds: string[] = [];
  for (const city of config.cities) {
    if (city.id === departureCityId) continue;
    if (city.kind === 'departure') continue;
    if (lower.includes(city.name.toLowerCase())) {
      waypointIds.push(city.id);
    }
  }

  let vehicleId = findVehicleId(config, text);
  if (!vehicleId) {
    if (adults >= 15) {
      vehicleId = config.vehicles.find((v) => v.id === 'coaster')?.id ?? config.vehicles.find((v) => v.type === 'van')?.id;
    } else {
      vehicleId = config.vehicles[0]?.id;
    }
  }

  const categoryId = pickCategoryId(text);
  const totalNights = Math.max(tripDays - 1, 1);
  const stops = waypointIds.length > 0 ? waypointIds : ['skardu'];
  const nightsPerStop = Math.max(Math.floor(totalNights / stops.length), 1);

  const hotelNights: HotelNightInput[] = stops.map((destinationId) => {
    const hotel = config.hotels.find((h) => h.cityId === destinationId && h.categoryId === categoryId)
      ?? config.hotels.find((h) => h.cityId === destinationId);
    return {
      destinationId,
      categoryId: hotel?.categoryId ?? categoryId,
      ...(hotel ? { hotelId: hotel.id } : {}),
      rooms,
      nights: nightsPerStop,
    };
  });

  if (waypointIds.length === 0) {
    warnings.push('Could not detect destinations — review itinerary stops');
  }

  const cityNames = waypointIds
    .map((id) => config.cities.find((c) => c.id === id)?.name)
    .filter(Boolean);
  const packageTitle =
    cityNames.length > 0
      ? `${cityNames.join(' & ')} Tour - ${categoryId === 'executive' ? 'Executive' : 'Deluxe'} Plan`
      : 'Northern Pakistan Tour';

  return {
    packageTitle,
    departureCityId,
    waypointIds: waypointIds.length > 0 ? waypointIds : stops,
    vehicleId,
    tripDays,
    adults,
    children: 0,
    hotelNights,
    jeepSegments: [],
    tickets: [],
    marginPercent: config.provisions.defaultMarginPercent,
    quoteMode: lower.includes('per person') ? 'perPerson' : 'family',
    warnings: warnings.length ? warnings : ['Parsed with local rules — review all fields'],
  };
}

async function callParseFunction(text: string, url: string): Promise<ParsedRequirement> {
  const callable = httpsCallableFromURL<{ text: string }, ParsedRequirement>(functions, url);
  const response = await callable({ text });
  return {
    ...response.data,
    warnings: response.data.warnings ?? [],
  };
}

export async function parseClientRequirement(
  text: string,
  config: AppConfig = seedConfig,
): Promise<ParseResult> {
  const urls = getCallableUrls();
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const result = await callParseFunction(text, url);
      return { result, source: 'ai' };
    } catch (err) {
      errors.push(parseCallableError(err));
    }
  }

  const uniqueErrors = [...new Set(errors)];
  const error = uniqueErrors.length === 1
    ? uniqueErrors[0]
    : `${NETWORK_ERROR_HINT} (${uniqueErrors.join('; ')})`;

  return {
    result: parseRequirementLocally(text, config),
    source: 'local',
    error,
  };
}
