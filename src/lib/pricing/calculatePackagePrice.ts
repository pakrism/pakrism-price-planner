import { calculateFuelCost } from './fuelCost';
import type {
  AppConfig,
  CalculationInput,
  DistanceResult,
  PriceBreakdown,
} from './types';

function getHotelPrice(
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
    const category = config.hotelCategories.find((c) => c.id === night.categoryId);
    const pricePerNight = getHotelPrice(night.categoryId, night.destinationId, config);
    return {
      destination: destination?.name ?? night.destinationId,
      category: category?.name ?? night.categoryId,
      nights: night.nights,
      pricePerNight,
      cost: night.nights * pricePerNight,
    };
  });
  const hotelsTotal = hotelLineItems.reduce((sum, item) => sum + item.cost, 0);

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
    fuel.cost + vehicleRent.cost + driver + tolls + hotelsTotal + ticketsTotal;
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
    tickets: { lineItems: ticketLineItems, total: ticketsTotal },
    subtotal,
    margin: { percent: input.marginPercent, amount: marginAmount },
    totalWithMargin,
    pricePerPerson,
  };
}
