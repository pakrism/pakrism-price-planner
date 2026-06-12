import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { PriceBreakdown } from '../../lib/pricing/types';
import { formatNumber, formatPkr } from '../../utils/format';

interface Props {
  breakdown: PriceBreakdown | null;
  error?: string | null;
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 400 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function PriceBreakdownCard({ breakdown, error }: Props) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!breakdown) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Fill in the itinerary and click Calculate to see the cost breakdown.
        </Typography>
      </Paper>
    );
  }

  const text = [
    `Distance: ${formatNumber(breakdown.distance.totalKm, 0)} km (${breakdown.distance.source})`,
    `Fuel: ${formatNumber(breakdown.fuel.liters, 1)} L × ${formatPkr(breakdown.fuel.pricePerLiter)} = ${formatPkr(breakdown.fuel.cost)}`,
    `Vehicle rent: ${formatPkr(breakdown.vehicleRent.cost)}`,
    `Provisions: ${formatPkr(breakdown.provisions.total)}`,
    `Hotels: ${formatPkr(breakdown.hotels.total)}`,
    `Tickets: ${formatPkr(breakdown.tickets.total)}`,
    `Subtotal: ${formatPkr(breakdown.subtotal)}`,
    `Margin (${breakdown.margin.percent}%): ${formatPkr(breakdown.margin.amount)}`,
    `Total: ${formatPkr(breakdown.totalWithMargin)}`,
    `Per person: ${formatPkr(breakdown.pricePerPerson)}`,
  ].join('\n');

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Cost Breakdown</Typography>
          <Chip
            size="small"
            label={breakdown.distance.source === 'google' ? 'Google Maps' : 'Manual matrix'}
            color={breakdown.distance.source === 'google' ? 'success' : 'warning'}
          />
        </Stack>

        {breakdown.distance.missingLegs && breakdown.distance.missingLegs.length > 0 && (
          <Alert severity="warning">
            Missing distance legs: {breakdown.distance.missingLegs.join(', ')}. Add them in Admin →
            Distance Matrix.
          </Alert>
        )}

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Distance
          </Typography>
          <Line label="Outbound" value={`${formatNumber(breakdown.distance.outboundKm, 0)} km`} />
          <Line label="Return" value={`${formatNumber(breakdown.distance.returnKm, 0)} km`} />
          <Line label="Buffer" value={`${formatNumber(breakdown.distance.bufferKm, 0)} km`} />
          <Line label="Total" value={`${formatNumber(breakdown.distance.totalKm, 0)} km`} bold />
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Fuel
          </Typography>
          <Line
            label={`${formatNumber(breakdown.distance.totalKm, 0)} km ÷ ${breakdown.fuel.avgKmPerLiter} km/L`}
            value={`${formatNumber(breakdown.fuel.liters, 1)} L`}
          />
          <Line
            label={`× ${formatPkr(breakdown.fuel.pricePerLiter)} / L (ceiling)`}
            value={formatPkr(breakdown.fuel.cost)}
            bold
          />
        </Box>

        <Line label="Vehicle rent" value={formatPkr(breakdown.vehicleRent.cost)} />
        <Line label="Driver" value={formatPkr(breakdown.provisions.driver)} />
        <Line label="Tolls" value={formatPkr(breakdown.provisions.tolls)} />
        {breakdown.provisions.tax > 0 && (
          <Line label="Tax" value={formatPkr(breakdown.provisions.tax)} />
        )}

        {breakdown.hotels.lineItems.map((item) => (
          <Line
            key={`${item.destination}-${item.category}`}
            label={`${item.destination} (${item.category}, ${item.nights}n)`}
            value={formatPkr(item.cost)}
          />
        ))}

        {breakdown.tickets.lineItems.map((item) => (
          <Line
            key={item.name}
            label={`${item.name} × ${item.quantity}`}
            value={formatPkr(item.cost)}
          />
        ))}

        <Divider />
        <Line label="Subtotal" value={formatPkr(breakdown.subtotal)} bold />
        <Line
          label={`Margin (${breakdown.margin.percent}%)`}
          value={formatPkr(breakdown.margin.amount)}
        />
        <Line label="Total with margin" value={formatPkr(breakdown.totalWithMargin)} bold />

        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
          <Typography variant="overline">Suggested price per person</Typography>
          <Typography variant="h4">{formatPkr(breakdown.pricePerPerson)}</Typography>
        </Box>

        <Button
          startIcon={<ContentCopyIcon />}
          variant="outlined"
          onClick={() => navigator.clipboard.writeText(text)}
        >
          Copy breakdown
        </Button>
      </Stack>
    </Paper>
  );
}
