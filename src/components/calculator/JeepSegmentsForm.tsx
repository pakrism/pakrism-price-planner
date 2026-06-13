import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { AppConfig, JeepSegmentSelection } from '../../lib/pricing/types';
import { getJeepSegmentsForItinerary } from '../../lib/pricing/helpers';
import { suggestJeepQuantity } from '../../lib/pricing/calculatePackagePrice';

interface Props {
  config: AppConfig;
  waypointIds: string[];
  pax: number;
  value: JeepSegmentSelection[];
  onChange: (value: JeepSegmentSelection[]) => void;
}

export default function JeepSegmentsForm({ config, waypointIds, pax, value, onChange }: Props) {
  const available = getJeepSegmentsForItinerary(config, waypointIds);

  if (available.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No jeep segments for current itinerary stops.
      </Typography>
    );
  }

  function toggle(segmentId: string, checked: boolean) {
    if (!checked) {
      onChange(value.filter((v) => v.segmentId !== segmentId));
      return;
    }
    const segment = config.jeepSegments.find((s) => s.id === segmentId);
    if (!segment) return;
    onChange([
      ...value,
      {
        segmentId,
        quantity: suggestJeepQuantity(pax, segment.capacity),
        days: segment.defaultDays,
      },
    ]);
  }

  function updateQty(segmentId: string, quantity: number) {
    onChange(value.map((v) => (v.segmentId === segmentId ? { ...v, quantity } : v)));
  }

  return (
    <Stack spacing={1}>
      {available.map((segment) => {
        const selected = value.find((v) => v.segmentId === segment.id);
        return (
          <Stack key={segment.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(selected)}
                  onChange={(e) => toggle(segment.id, e.target.checked)}
                />
              }
              label={`${segment.name} (PKR ${segment.pricePerJeep}/jeep/day)`}
            />
            {selected && (
              <TextField
                size="small"
                label="Jeeps"
                type="number"
                slotProps={{ htmlInput: { min: 1 } }}
                value={selected.quantity}
                onChange={(e) => updateQty(segment.id, Number(e.target.value) || 1)}
                sx={{ width: 100 }}
              />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
