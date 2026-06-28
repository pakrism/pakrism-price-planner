import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { DistanceResult } from '../../lib/pricing/types';
import type { FuelPreview } from '../../lib/hooks/useTripDistance';

function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function formatPkr(value: number): string {
  return `PKR ${formatNumber(Math.round(value))}`;
}

interface Props {
  distance: DistanceResult | null;
  fuelPreview: FuelPreview | null;
  loading: boolean;
  error: string | null;
  fuelPriceSource: number;
}

export default function DistancePreviewStrip({
  distance,
  fuelPreview,
  loading,
  error,
  fuelPriceSource,
}: Props) {
  if (loading && !distance) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">Fetching road distance…</Typography>
      </Stack>
    );
  }

  if (!distance && !error) {
    return (
      <Typography variant="body2" color="text.secondary">
        Add itinerary stops to see live distance and fuel estimates.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {error && <Alert severity="warning">{error}</Alert>}

      {distance && (
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Route distance</Typography>
            <Chip
              size="small"
              label={distance.source === 'google' ? 'Google Maps' : 'Manual matrix'}
              color={distance.source === 'google' ? 'success' : 'warning'}
            />
            {loading && <CircularProgress size={16} />}
          </Stack>

          <Typography variant="body2">
            Outbound: {formatNumber(distance.outboundKm, 0)} km · Return: {formatNumber(distance.returnKm, 0)} km · Buffer: {formatNumber(distance.bufferKm, 0)} km · Total: <strong>{formatNumber(distance.totalKm, 0)} km</strong>
          </Typography>

          {fuelPreview && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Est. fuel: {formatNumber(fuelPreview.liters, 1)} L × PKR {fuelPreview.pricePerLiter}/L = <strong>{formatPkr(fuelPreview.cost)}</strong>
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (@ PKR {formatNumber(fuelPriceSource)}/L from admin)
              </Typography>
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
}
