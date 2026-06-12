/**
 * Optional Cloud Function proxy for fuel price fetch (avoids CORS).
 * Deploy separately if you host a JSON endpoint that scrapes OGRA prices.
 *
 * Expected response shape: { petrol: 279.5, diesel: 290.1 }
 */
exports.fetchFuelPrice = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  const url = process.env.FUEL_PRICE_URL;
  if (!url) {
    return res.status(500).json({ error: 'FUEL_PRICE_URL not configured' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.json({
      petrol: Math.ceil(Number(data.petrol)),
      diesel: Math.ceil(Number(data.diesel)),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
};
