import { calculateFuelCost } from './fuelCost';
import type {
  AppConfig,
  CalculationInput,
  DistanceResult,
  HotelNightInput,
  PriceBreakdown,
} from './types';

function getCategoryPrice(
  categoryId: string,
  destinationId: string,
  config: AppConfig,
): number {
  const category = config.hotelCategories.find((c) => c.id === categoryId);
  if (!category) return 0;
  const destination = config.cities.find((c) => c.id === destinationId);
  const destName = destination?.name ?? destinationId;
  return category.destinationOverrides[destName] ?? category.defaultPricePerNight;
}

function getHotelRoomPrice(
  night: HotelNightInput,
  config: AppConfig,
): { pricePerRoomPerNight: number; hotelName: string; category: string } {
  const hotel = night.hotelId
    ? config.hotels.find((h) => h.id === night.hotelId)
    : undefined;
  const category = config.hotelCategories.find((c) => c.id === night.categoryId);

  if (hotel) {
    const hotelCategory = config.hotelCategories.find((c) => c.id === hotel.categoryId);
    return {
      pricePerRoomPerNight: hotel.pricePerRoomPerNight,
      hotelName: hotel.name,
      category: hotelCategory?.name ?? night.categoryId,
    };
  }

  return {
    pricePerRoomPerNight: getCategoryPrice(night.categoryId, night.destinationId, config),
    hotelName: category?.name ?? 'Hotel',
    category: category?.name ?? night.categoryId,
  };
}

export function calculatePackagePrice(
  input: CalculationInput,
  config: AppConfig,
  distance: DistanceResult,
): PriceBreakdown {
  const vehicle = config.vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const fuelPrice = input.fuelPriceOverride ?? config.fuel.manualPricePerLiter;
  const fuel = calculateFuelCost(distance.totalKm, vehicle.avgKmPerLiter, fuelPrice);

  const vehicleRent = {
    days: input.tripDays,
    perDay: vehicle.perDayRent,
    cost: input.tripDays * vehicle.perDayRent,
  };

  const driver = input.tripDays * config.provisions.driverPerDay;
  const tolls = input.tollsOverride ?? config.provisions.tolls;

  const hotelLineItems = input.hotelNights.map((night) => {
    const destination = config.cities.find((c) => c.id === night.destinationId);
    const { pricePerRoomPerNight, hotelName, category } = getHotelRoomPrice(night, config);
    const rooms = night.rooms || 1;
    return {
      destination: destination?.name ?? night.destinationId,
      hotelName,
      category,
      nights: night.nights,
      rooms,
      pricePerRoomPerNight,
      cost: night.nights * rooms * pricePerRoomPerNight,
    };
  });
  const hotelsTotal = hotelLineItems.reduce((sum, item) => sum + item.cost, 0);

  const jeepLineItems = input.jeepSegments.map((sel) => {
    const segment = config.jeepSegments.find((s) => s.id === sel.segmentId);
    const days = sel.days ?? segment?.defaultDays ?? 1;
    const pricePerJeep = segment?.pricePerJeep ?? 0;
    return {
      name: segment?.name ?? sel.segmentId,
      quantity: sel.quantity,
      days,
      pricePerJeep,
      cost: sel.quantity * days * pricePerJeep,
    };
  });
  const jeepsTotal = jeepLineItems.reduce((sum, item) => sum + item.cost, 0);

  const ticketLineItems = input.tickets.map((sel) => {
    const ticket = config.entryTickets.find((t) => t.id === sel.ticketId);
    const unitPrice = ticket?.price ?? 0;
    return {
      name: ticket?.name ?? sel.ticketId,
      quantity: sel.quantity,
      unitPrice,
      cost: sel.quantity * unitPrice,
    };
  });
  const ticketsTotal = ticketLineItems.reduce((sum, item) => sum + item.cost, 0);

  const subtotalBeforeTax =
    fuel.cost + vehicleRent.cost + driver + tolls + hotelsTotal + jeepsTotal + ticketsTotal;
  const tax = (subtotalBeforeTax * config.provisions.taxPercent) / 100;
  const subtotal = subtotalBeforeTax + tax;

  const marginAmount = (subtotal * input.marginPercent) / 100;
  const totalWithMargin = subtotal + marginAmount;
  const pricePerPerson = input.pax > 0 ? totalWithMargin / input.pax : 0;

  return {
    distance,
    fuel: { avgKmPerLiter: vehicle.avgKmPerLiter, ...fuel },
    vehicleRent,
    provisions: { driver, tolls, tax, total: driver + tolls + tax },
    hotels: { lineItems: hotelLineItems, total: hotelsTotal },
    jeeps: { lineItems: jeepLineItems, total: jeepsTotal },
    tickets: { lineItems: ticketLineItems, total: ticketsTotal },
    subtotal,
    margin: { percent: input.marginPercent, amount: marginAmount },
    totalWithMargin,
    pricePerPerson,
  };
}

export function suggestJeepQuantity(pax: number, capacity: number): number {
  if (capacity <= 0) return 1;
  return Math.ceil(pax / capacity);
}
