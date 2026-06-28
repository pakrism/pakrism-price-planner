import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import DistancePreviewStrip from '../components/calculator/DistancePreviewStrip';
import HotelNightsForm from '../components/calculator/HotelNightsForm';
import ItineraryBuilder from '../components/calculator/ItineraryBuilder';
import JeepSegmentsForm from '../components/calculator/JeepSegmentsForm';
import PriceBreakdownCard from '../components/calculator/PriceBreakdownCard';
import { useConfig } from '../context/ConfigProvider';
import { useTripDistance } from '../lib/hooks/useTripDistance';
import { calculatePackagePrice } from '../lib/pricing/calculatePackagePrice';
import { getDepartureCities, getStopsForVehicle, syncHotelNightsFromStops } from '../lib/pricing/helpers';
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
import type { ParseResult } from '../lib/services/aiParser';
import { resolveTripDistance } from '../lib/services/distanceService';

const aiParsingEnabled = import.meta.env.VITE_ENABLE_AI_PARSING !== 'false';

interface CalculatorFormState {
  packageTitle: string;
  departureCityId: string;
  waypointIds: string[];
  vehicleId: string;
  tripDays: number;
  hotelNights: HotelNightInput[];
  jeepSegments: JeepSegmentSelection[];
  selectedTickets: Record<string, boolean>;
  ticketQty: Record<string, number>;
  adults: number;
  children: number;
  quoteMode: QuoteMode;
  marginPercent: number;
}

function buildFormState(parsed: ParsedRequirement, current: CalculatorFormState): CalculatorFormState {
  const next = { ...current };

  if (parsed.packageTitle) next.packageTitle = parsed.packageTitle;
  if (parsed.departureCityId) next.departureCityId = parsed.departureCityId;
  if (parsed.waypointIds) next.waypointIds = parsed.waypointIds;
  if (parsed.vehicleId) next.vehicleId = parsed.vehicleId;
  if (parsed.tripDays) next.tripDays = parsed.tripDays;
  if (parsed.adults != null) next.adults = parsed.adults;
  if (parsed.children != null) next.children = parsed.children;
  if (parsed.hotelNights) next.hotelNights = parsed.hotelNights;
  if (parsed.jeepSegments) next.jeepSegments = parsed.jeepSegments;
  if (parsed.marginPercent != null) next.marginPercent = parsed.marginPercent;
  if (parsed.quoteMode) next.quoteMode = parsed.quoteMode;

  if (parsed.tickets) {
    const selectedTickets: Record<string, boolean> = {};
    const ticketQty: Record<string, number> = {};
    parsed.tickets.forEach((t) => {
      selectedTickets[t.ticketId] = true;
      ticketQty[t.ticketId] = t.quantity;
    });
    next.selectedTickets = selectedTickets;
    next.ticketQty = ticketQty;
  }

  return next;
}

export default function CalculatorPage() {
  const { config, usingLocalDefaults } = useConfig();
  const [form, setForm] = useState<CalculatorFormState>({
    packageTitle: 'Skardu & Hunza Tour - Deluxe Plan',
    departureCityId: 'islamabad',
    waypointIds: [],
    vehicleId: config.vehicles[0]?.id ?? '',
    tripDays: 8,
    hotelNights: [
      { destinationId: 'skardu', categoryId: 'deluxe', hotelId: 'maple-skardu', rooms: 1, nights: 3 },
      { destinationId: 'hunza', categoryId: 'deluxe', hotelId: 'hunza-elite', rooms: 1, nights: 3 },
    ],
    jeepSegments: [],
    selectedTickets: {},
    ticketQty: {},
    adults: 5,
    children: 0,
    quoteMode: 'family',
    marginPercent: config.provisions.defaultMarginPercent,
  });
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [customerQuote, setCustomerQuote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const lastAutoCalcKey = useRef('');

  const {
    packageTitle,
    departureCityId,
    waypointIds,
    vehicleId,
    tripDays,
    hotelNights,
    jeepSegments,
    selectedTickets,
    ticketQty,
    adults,
    children,
    quoteMode,
    marginPercent,
  } = form;

  const pax = adults + children;
  const selectedVehicle = config.vehicles.find((v) => v.id === vehicleId);

  const stopCities = useMemo(
    () => (selectedVehicle ? getStopsForVehicle(config, selectedVehicle.type ?? 'car') : []),
    [config, selectedVehicle],
  );

  const {
    distance: liveDistance,
    fuelPreview,
    outboundLegs,
    loading: distanceLoading,
    error: distanceError,
  } = useTripDistance(departureCityId, waypointIds, config, vehicleId);

  function updateForm<K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleWaypointChange(ids: string[]) {
    setForm((prev) => ({
      ...prev,
      waypointIds: ids,
      hotelNights: syncHotelNightsFromStops(ids, prev.tripDays, prev.hotelNights, config),
    }));
  }

  const runCalculation = useCallback(async (state: CalculatorFormState) => {
    setCalculating(true);
    setError(null);
    setCustomerQuote(null);
    try {
      const statePax = state.adults + state.children;
      const stateTickets: TicketSelection[] = Object.entries(state.selectedTickets)
        .filter(([, checked]) => checked)
        .map(([ticketId]) => ({ ticketId, quantity: state.ticketQty[ticketId] ?? statePax }));

      const distance = await resolveTripDistance(
        state.departureCityId,
        state.waypointIds,
        config.provisions.defaultBufferKm,
        config,
      );
      if (distance.missingLegs?.length) {
        throw new Error(`Missing distance data for: ${distance.missingLegs.join(', ')}`);
      }

      const input: CalculationInput = {
        departureCityId: state.departureCityId,
        waypointIds: state.waypointIds,
        vehicleId: state.vehicleId,
        tripDays: state.tripDays,
        hotelNights: state.hotelNights.filter((h) => h.destinationId),
        jeepSegments: state.jeepSegments,
        tickets: stateTickets,
        pax: statePax,
        marginPercent: state.marginPercent,
        packageTitle: state.packageTitle,
        quoteMode: state.quoteMode,
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
  }, [config]);

  async function handleCalculate() {
    await runCalculation(form);
  }

  async function handleAiParsed(parsed: ParseResult) {
    const next = buildFormState(parsed.result, form);
    setForm(next);
    if (parsed.source === 'ai') {
      await runCalculation(next);
    }
  }

  const autoCalcKey = liveDistance && !liveDistance.missingLegs?.length
    ? `${liveDistance.totalKm}:${liveDistance.source}:${departureCityId}:${waypointIds.join(',')}:${vehicleId}`
    : '';

  useEffect(() => {
    if (!autoCalcKey || distanceLoading || !vehicleId || waypointIds.length === 0) return;
    if (lastAutoCalcKey.current === autoCalcKey) return;
    lastAutoCalcKey.current = autoCalcKey;
    void runCalculation(form);
  }, [autoCalcKey, distanceLoading, form, runCalculation, vehicleId, waypointIds.length]);

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

      {aiParsingEnabled && (
        <Paper sx={{ p: 3 }}>
          <AiRequirementPanel config={config} onParsed={handleAiParsed} />
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField label="Package title" value={packageTitle} onChange={(e) => updateForm('packageTitle', e.target.value)} fullWidth />

              <FormControl fullWidth>
                <InputLabel>Departure city</InputLabel>
                <Select label="Departure city" value={departureCityId} onChange={(e) => updateForm('departureCityId', e.target.value)}>
                  {getDepartureCities(config).map((city) => (
                    <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Itinerary stops</Typography>
                <ItineraryBuilder
                  cities={stopCities.filter((c) => c.id !== departureCityId)}
                  waypointIds={waypointIds}
                  onChange={handleWaypointChange}
                  outboundLegs={outboundLegs}
                />
              </Box>

              <DistancePreviewStrip
                distance={liveDistance}
                fuelPreview={fuelPreview}
                loading={distanceLoading}
                error={distanceError}
                fuelPriceSource={config.fuel.manualPricePerLiter}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle</InputLabel>
                    <Select label="Vehicle" value={vehicleId} onChange={(e) => updateForm('vehicleId', e.target.value)}>
                      {config.vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>{v.name} ({v.avgKmPerLiter} km/L)</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Trip days" type="number" slotProps={{ htmlInput: { min: 1 } }} value={tripDays} onChange={(e) => updateForm('tripDays', Number(e.target.value) || 1)} />
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Hotel stays</Typography>
                <HotelNightsForm config={config} value={hotelNights} onChange={(value) => updateForm('hotelNights', value)} />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Jeep add-ons</Typography>
                <JeepSegmentsForm config={config} waypointIds={waypointIds} pax={pax} value={jeepSegments} onChange={(value) => updateForm('jeepSegments', value)} />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Entry tickets</Typography>
                <Stack spacing={1}>
                  {config.entryTickets.map((ticket) => (
                    <Stack key={ticket.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <FormControlLabel
                        control={<Checkbox checked={Boolean(selectedTickets[ticket.id])} onChange={(e) => updateForm('selectedTickets', { ...selectedTickets, [ticket.id]: e.target.checked })} />}
                        label={`${ticket.name} (PKR ${ticket.price})`}
                      />
                      {selectedTickets[ticket.id] && (
                        <TextField size="small" label="Qty" type="number" slotProps={{ htmlInput: { min: 1 } }} value={ticketQty[ticket.id] ?? pax} onChange={(e) => updateForm('ticketQty', { ...ticketQty, [ticket.id]: Number(e.target.value) || 1 })} sx={{ width: 100 }} />
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="Adults" type="number" slotProps={{ htmlInput: { min: 1 } }} value={adults} onChange={(e) => updateForm('adults', Number(e.target.value) || 1)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="Children" type="number" slotProps={{ htmlInput: { min: 0 } }} value={children} onChange={(e) => updateForm('children', Number(e.target.value) || 0)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Quote mode</InputLabel>
                    <Select label="Quote mode" value={quoteMode} onChange={(e) => updateForm('quoteMode', e.target.value as QuoteMode)}>
                      <MenuItem value="family">Family total</MenuItem>
                      <MenuItem value="perPerson">Per person</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box>
                <Typography gutterBottom>Margin: {marginPercent}%</Typography>
                <Slider value={marginPercent} min={0} max={50} step={1} onChange={(_, v) => updateForm('marginPercent', v as number)} valueLabelDisplay="auto" />
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
