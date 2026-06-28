function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fetchRouteKm(cityIds, cityMap, apiKey) {
  if (cityIds.length < 2) {
    return { km: 0, legs: [] };
  }

  const cities = cityIds.map((id) => cityMap.get(id));
  if (cities.some((city) => !city)) {
    throw new Error('Unknown city id in route');
  }

  const origin = `${cities[0].lat},${cities[0].lng}`;
  const destination = `${cities[cities.length - 1].lat},${cities[cities.length - 1].lng}`;
  const intermediate = cities.slice(1, -1);

  const params = new URLSearchParams({
    origin,
    destination,
    mode: 'driving',
    units: 'metric',
    key: apiKey,
  });

  if (intermediate.length > 0) {
    params.set('waypoints', intermediate.map((city) => `${city.lat},${city.lng}`).join('|'));
  }

  const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
  const data = await res.json();

  if (data.status !== 'OK') {
    throw new Error(data.error_message || data.status || 'Directions request failed');
  }

  const route = data.routes[0];
  let totalMeters = 0;
  const legs = route.legs.map((leg, index) => {
    totalMeters += leg.distance.value;
    return {
      from: cities[index].name,
      to: cities[index + 1].name,
      km: Math.round((leg.distance.value / 1000) * 10) / 10,
    };
  });

  return { km: totalMeters / 1000, legs };
}

export default async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: { message: 'Method not allowed' } }, 405);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: { message: 'GOOGLE_MAPS_API_KEY is not configured' } }, 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { routes, cities } = body ?? {};
  if (!Array.isArray(routes) || !Array.isArray(cities)) {
    return jsonResponse({ error: { message: 'routes and cities arrays are required' } }, 400);
  }

  const cityMap = new Map(cities.map((city) => [city.id, city]));

  try {
    const results = [];
    for (const route of routes) {
      const cityIds = route?.cityIds ?? [];
      const result = await fetchRouteKm(cityIds, cityMap, apiKey);
      results.push(result);
    }

    return jsonResponse({ source: 'google', routes: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Directions lookup failed';
    return jsonResponse({ error: { message } }, 502);
  }
};
