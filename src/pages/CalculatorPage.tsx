import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CalculateIcon from '@mui/icons-material/Calculate';
import AiRequirementPanel from '../components/calculator/AiRequirementPanel';
import CustomerQuoteCard from '../components/calculator/CustomerQuoteCard';
import HotelNightsForm from '../components/calculator/HotelNightsForm';
import ItineraryBuilder from '../components/calculator/ItineraryBuilder';
import JeepSegmentsForm from '../components/calculator/JeepSegmentsForm';
import PriceBreakdownCard from '../components/calculator/PriceBreakdownCard';
import { useConfig } from '../context/ConfigProvider';
import { calculatePackagePrice } from '../lib/pricing/calculatePackagePrice';
import { getDepartureCities, getStopsForVehicle } from '../lib/pricing/helpers';
import type {
  CalculationInput,
  HotelNightInput,
  JeepSegmentSelection,
  ParsedRequirement,
  PriceBreakdown,
  QuoteMode,
  TicketSelection,
} from '../lib/pricing/types';
import { buildQuoteFromCalculation } from '../lib/quote/generateCustomerQuote';
import { resolveTripDistance } from '../lib/services/distanceService';

export default function CalculatorPage() {
  const { config, usingLocalDefaults } = useConfig();
  const [packageTitle, setPackageTitle] = useState('Skardu & Hunza Tour - Deluxe Plan');
  const [departureCityId, setDepartureCityId] = useState('islamabad');
  const [waypointIds, setWaypointIds] = useState<string[]>([]);
  const [vehicleId, setVehicleId] = useState(config.vehicles[0]?.id ?? '');
  const [tripDays, setTripDays] = useState(8);
  const [hotelNights, setHotelNights] = useState<HotelNightInput[]>([
    { destinationId: 'skardu', categoryId: 'deluxe', hotelId: 'maple-skardu', rooms: 1, nights: 3 },
    { destinationId: 'hunza', categoryId: 'deluxe', hotelId: 'hunza-elite', rooms: 1, nights: 3 },
  ]);
  const [jeepSegments, setJeepSegments] = useState<JeepSegmentSelection[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, boolean>>({});
  const [ticketQty, setTicketQty] = useState<Record<string, number>>({});
  const [adults, setAdults] = useState(5);
  const [children, setChildren] = useState(0);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('family');
  const [marginPercent, setMarginPercent] = useState(config.provisions.defaultMarginPercent);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [customerQuote, setCustomerQuote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const pax = adults + children;
  const selectedVehicle = config.vehicles.find((v) => v.id === vehicleId);

  const stopCities = useMemo(
    () => (selectedVehicle ? getStopsForVehicle(config, selectedVehicle.type ?? 'car') : []),
    [config, selectedVehicle],
  );

  const tickets: TicketSelection[] = useMemo(
    () =>
      Object.entries(selectedTickets)
        .filter(([, checked]) => checked)
        .map(([ticketId]) => ({ ticketId, quantity: ticketQty[ticketId] ?? pax })),
    [selectedTickets, ticketQty, pax],
  );

  function applyParsed(parsed: ParsedRequirement) {
    if (parsed.packageTitle) setPackageTitle(parsed.packageTitle);
    if (parsed.departureCityId) setDepartureCityId(parsed.departureCityId);
    if (parsed.waypointIds) setWaypointIds(parsed.waypointIds);
    if (parsed.vehicleId) setVehicleId(parsed.vehicleId);
    if (parsed.tripDays) setTripDays(parsed.tripDays);
    if (parsed.adults != null) setAdults(parsed.adults);
    if (parsed.children != null) setChildren(parsed.children);
    if (parsed.hotelNights) setHotelNights(parsed.hotelNights);
    if (parsed.jeepSegments) setJeepSegments(parsed.jeepSegments);
    if (parsed.marginPercent != null) setMarginPercent(parsed.marginPercent);
    if (parsed.quoteMode) setQuoteMode(parsed.quoteMode);
    if (parsed.tickets) {
      const next: Record<string, boolean> = {};
      const qty: Record<string, number> = {};
      parsed.tickets.forEach((t) => {
        next[t.ticketId] = true;
        qty[t.ticketId] = t.quantity;
      });
      setSelectedTickets(next);
      setTicketQty(qty);
    }
  }

  async function handleCalculate() {
    setCalculating(true);
    setError(null);
    setCustomerQuote(null);
    try {
      const distance = await resolveTripDistance(
        departureCityId,
        waypointIds,
        config.provisions.defaultBufferKm,
        config,
      );
      if (distance.missingLegs?.length) {
        throw new Error(`Missing distance data for: ${distance.missingLegs.join(', ')}`);
      }

      const input: CalculationInput = {
        departureCityId,
        waypointIds,
        vehicleId,
        tripDays,
        hotelNights: hotelNights.filter((h) => h.destinationId),
        jeepSegments,
        tickets,
        pax,
        marginPercent,
        packageTitle,
        quoteMode,
        bufferKm: config.provisions.defaultBufferKm,
      };

      const result = calculatePackagePrice(input, config, distance);
      setBreakdown(result);
      setCustomerQuote(buildQuoteFromCalculation(input, result, config));
    } catch (err) {
      setBreakdown(null);
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>Road Package Calculator</Typography>
        <Typography color="text.secondary">Estimate package costs by road. Results are not saved.</Typography>
      </Box>

      {usingLocalDefaults && (
        <Alert severity="warning">
          Using built-in defaults — deploy Firestore rules to enable shared admin config.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <AiRequirementPanel config={config} onParsed={applyParsed} />
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField label="Package title" value={packageTitle} onChange={(e) => setPackageTitle(e.target.value)} fullWidth />

              <FormControl fullWidth>
                <InputLabel>Departure city</InputLabel>
                <Select label="Departure city" value={departureCityId} onChange={(e) => setDepartureCityId(e.target.value)}>
                  {getDepartureCities(config).map((city) => (
                    <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Itinerary stops</Typography>
                <ItineraryBuilder cities={stopCities.filter((c) => c.id !== departureCityId)} waypointIds={waypointIds} onChange={setWaypointIds} />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle</InputLabel>
                    <Select label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                      {config.vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>{v.name} ({v.avgKmPerLiter} km/L)</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Trip days" type="number" slotProps={{ htmlInput: { min: 1 } }} value={tripDays} onChange={(e) => setTripDays(Number(e.target.value) || 1)} />
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Hotel stays</Typography>
                <HotelNightsForm config={config} value={hotelNights} onChange={setHotelNights} />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Jeep add-ons</Typography>
                <JeepSegmentsForm config={config} waypointIds={waypointIds} pax={pax} value={jeepSegments} onChange={setJeepSegments} />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Entry tickets</Typography>
                <Stack spacing={1}>
                  {config.entryTickets.map((ticket) => (
                    <Stack key={ticket.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <FormControlLabel
                        control={<Checkbox checked={Boolean(selectedTickets[ticket.id])} onChange={(e) => setSelectedTickets((p) => ({ ...p, [ticket.id]: e.target.checked }))} />}
                        label={`${ticket.name} (PKR ${ticket.price})`}
                      />
                      {selectedTickets[ticket.id] && (
                        <TextField size="small" label="Qty" type="number" slotProps={{ htmlInput: { min: 1 } }} value={ticketQty[ticket.id] ?? pax} onChange={(e) => setTicketQty((p) => ({ ...p, [ticket.id]: Number(e.target.value) || 1 }))} sx={{ width: 100 }} />
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="Adults" type="number" slotProps={{ htmlInput: { min: 1 } }} value={adults} onChange={(e) => setAdults(Number(e.target.value) || 1)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="Children" type="number" slotProps={{ htmlInput: { min: 0 } }} value={children} onChange={(e) => setChildren(Number(e.target.value) || 0)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Quote mode</InputLabel>
                    <Select label="Quote mode" value={quoteMode} onChange={(e) => setQuoteMode(e.target.value as QuoteMode)}>
                      <MenuItem value="family">Family total</MenuItem>
                      <MenuItem value="perPerson">Per person</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box>
                <Typography gutterBottom>Margin: {marginPercent}%</Typography>
                <Slider value={marginPercent} min={0} max={50} step={1} onChange={(_, v) => setMarginPercent(v as number)} valueLabelDisplay="auto" />
              </Box>

              <Button variant="contained" size="large" startIcon={<CalculateIcon />} onClick={handleCalculate} disabled={calculating || !vehicleId}>
                {calculating ? 'Calculating…' : 'Calculate price'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <PriceBreakdownCard breakdown={breakdown} error={error} />
            <CustomerQuoteCard message={customerQuote} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
