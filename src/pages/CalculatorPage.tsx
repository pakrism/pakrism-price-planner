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
import HotelNightsForm from '../components/calculator/HotelNightsForm';
import ItineraryBuilder from '../components/calculator/ItineraryBuilder';
import PriceBreakdownCard from '../components/calculator/PriceBreakdownCard';
import { useConfig } from '../context/ConfigProvider';
import { calculatePackagePrice } from '../lib/pricing/calculatePackagePrice';
import type { PriceBreakdown, TicketSelection } from '../lib/pricing/types';
import { resolveTripDistance } from '../lib/services/distanceService';

export default function CalculatorPage() {
  const { config } = useConfig();
  const [departureCityId, setDepartureCityId] = useState('islamabad');
  const [waypointIds, setWaypointIds] = useState<string[]>([]);
  const [vehicleId, setVehicleId] = useState(config.vehicles[0]?.id ?? '');
  const [tripDays, setTripDays] = useState(7);
  const [hotelNights, setHotelNights] = useState([
    { destinationId: 'skardu', categoryId: 'deluxe', nights: 3 },
  ]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, boolean>>({});
  const [ticketQty, setTicketQty] = useState<Record<string, number>>({});
  const [adults, setAdults] = useState(4);
  const [children, setChildren] = useState(0);
  const [marginPercent, setMarginPercent] = useState(config.provisions.defaultMarginPercent);
  const [bufferKm, setBufferKm] = useState<number | ''>('');
  const [fuelOverride, setFuelOverride] = useState<number | ''>('');
  const [tollsOverride, setTollsOverride] = useState<number | ''>('');
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const pax = adults + children;
  const effectiveBuffer = bufferKm === '' ? config.provisions.defaultBufferKm : Number(bufferKm);

  const tickets: TicketSelection[] = useMemo(
    () =>
      Object.entries(selectedTickets)
        .filter(([, checked]) => checked)
        .map(([ticketId]) => ({
          ticketId,
          quantity: ticketQty[ticketId] ?? pax,
        })),
    [selectedTickets, ticketQty, pax],
  );

  async function handleCalculate() {
    setCalculating(true);
    setError(null);
    try {
      const distance = await resolveTripDistance(
        departureCityId,
        waypointIds,
        effectiveBuffer,
        config,
      );

      if (distance.missingLegs && distance.missingLegs.length > 0) {
        throw new Error(`Missing distance data for: ${distance.missingLegs.join(', ')}`);
      }

      const result = calculatePackagePrice(
        {
          departureCityId,
          waypointIds,
          vehicleId,
          tripDays,
          hotelNights: hotelNights.filter((h) => h.destinationId),
          tickets,
          pax,
          marginPercent,
          bufferKm: effectiveBuffer,
          fuelPriceOverride: fuelOverride === '' ? undefined : Number(fuelOverride),
          tollsOverride: tollsOverride === '' ? undefined : Number(tollsOverride),
        },
        config,
        distance,
      );
      setBreakdown(result);
    } catch (err) {
      setBreakdown(null);
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  }

  const vehicle = config.vehicles.find((v) => v.id === vehicleId);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Road Package Calculator
        </Typography>
        <Typography color="text.secondary">
          Estimate package costs by road. Results are not saved.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Departure city</InputLabel>
                <Select
                  label="Departure city"
                  value={departureCityId}
                  onChange={(e) => setDepartureCityId(e.target.value)}
                >
                  {config.cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Itinerary stops
                </Typography>
                <ItineraryBuilder
                  cities={config.cities.filter((c) => c.id !== departureCityId)}
                  waypointIds={waypointIds}
                  onChange={setWaypointIds}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle</InputLabel>
                    <Select
                      label="Vehicle"
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                    >
                      {config.vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name} ({v.avgKmPerLiter} km/L)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Trip days"
                    type="number"
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={tripDays}
                    onChange={(e) => setTripDays(Number(e.target.value) || 1)}
                  />
                </Grid>
              </Grid>

              {vehicle && (
                <Alert severity="info">
                  {vehicle.name}: {vehicle.avgKmPerLiter} km/L average, PKR{' '}
                  {vehicle.perDayRent.toLocaleString()} / day
                </Alert>
              )}

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Hotel nights
                </Typography>
                <HotelNightsForm
                  cities={config.cities}
                  hotelCategories={config.hotelCategories}
                  value={hotelNights}
                  onChange={setHotelNights}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Entry tickets
                </Typography>
                <Stack spacing={1}>
                  {config.entryTickets.map((ticket) => (
                    <Stack key={ticket.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(selectedTickets[ticket.id])}
                            onChange={(e) =>
                              setSelectedTickets((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.checked,
                              }))
                            }
                          />
                        }
                        label={`${ticket.name} (PKR ${ticket.price})`}
                      />
                      {selectedTickets[ticket.id] && (
                        <TextField
                          size="small"
                          label="Qty"
                          type="number"
                          slotProps={{ htmlInput: { min: 1 } }}
                          value={ticketQty[ticket.id] ?? pax}
                          onChange={(e) =>
                            setTicketQty((prev) => ({
                              ...prev,
                              [ticket.id]: Number(e.target.value) || 1,
                            }))
                          }
                          sx={{ width: 100 }}
                        />
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Adults"
                    type="number"
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value) || 1)}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Children"
                    type="number"
                    slotProps={{ htmlInput: { min: 0 } }}
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value) || 0)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Buffer km"
                    type="number"
                    placeholder={String(config.provisions.defaultBufferKm)}
                    value={bufferKm}
                    onChange={(e) =>
                      setBufferKm(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography gutterBottom>Margin: {marginPercent}%</Typography>
                <Slider
                  value={marginPercent}
                  min={0}
                  max={50}
                  step={1}
                  onChange={(_, value) => setMarginPercent(value as number)}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Fuel price override (PKR/L)"
                    type="number"
                    placeholder={String(config.fuel.manualPricePerLiter)}
                    value={fuelOverride}
                    onChange={(e) =>
                      setFuelOverride(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Tolls override (PKR)"
                    type="number"
                    placeholder={String(config.provisions.tolls)}
                    value={tollsOverride}
                    onChange={(e) =>
                      setTollsOverride(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="large"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
                disabled={calculating || !vehicleId}
              >
                {calculating ? 'Calculating…' : 'Calculate price'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <PriceBreakdownCard breakdown={breakdown} error={error} />
        </Grid>
      </Grid>
    </Stack>
  );
}
