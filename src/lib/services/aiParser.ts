import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { AppConfig, ParsedRequirement } from '../pricing/types';
import { seedConfig } from '../../data/seedConfig';

function findVehicleId(config: AppConfig, text: string): string | undefined {
  const lower = text.toLowerCase();
  return config.vehicles.find(
    (v) =>
      lower.includes(v.name.toLowerCase()) ||
      lower.includes(v.type.replace('-', ' ')),
  )?.id;
}

/** Rule-based fallback when Cloud Function / OpenAI unavailable */
export function parseRequirementLocally(text: string, config: AppConfig): ParsedRequirement {
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  const daysMatch = text.match(/(\d+)\s*days?/i);
  const tripDays = daysMatch ? Number(daysMatch[1]) : 7;

  const paxMatch = text.match(/(?:family of|for)\s*(\d+)/i) ?? text.match(/(\d+)\s*(?:pax|persons?|people|adults?)/i);
  const adults = paxMatch ? Number(paxMatch[1]) : 4;

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

  const vehicleId = findVehicleId(config, text) ?? config.vehicles[0]?.id;

  let categoryId = 'deluxe';
  if (lower.includes('executive')) categoryId = 'executive';

  const hotelNights = waypointIds.slice(0, 3).map((destinationId) => ({
    destinationId,
    categoryId,
    rooms: 1,
    nights: Math.max(tripDays - 1, 1),
  }));

  if (waypointIds.length === 0) {
    warnings.push('Could not detect destinations — add stops manually');
  }

  const titleMatch = text.match(/^(.{10,60}?)(?:\n|tour|package)/im);
  const packageTitle =
    titleMatch?.[1]?.trim() ||
    (waypointIds.length > 0
      ? `${waypointIds.map((id) => config.cities.find((c) => c.id === id)?.name).filter(Boolean).join(' & ')} Tour`
      : 'Northern Pakistan Tour');

  return {
    packageTitle,
    departureCityId,
    waypointIds,
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

export async function parseClientRequirement(
  text: string,
  config: AppConfig = seedConfig,
): Promise<ParsedRequirement> {
  try {
    const functions = getFunctions(getApp(), 'us-central1');
    const callable = httpsCallable<{ text: string }, ParsedRequirement>(
      functions,
      'parseClientRequirement',
    );
    const result = await callable({ text });
    return {
      ...parseRequirementLocally(text, config),
      ...result.data,
      warnings: result.data.warnings ?? [],
    };
  } catch {
    return parseRequirementLocally(text, config);
  }
}
