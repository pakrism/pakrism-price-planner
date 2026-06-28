import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import type { City } from '../../lib/pricing/types';

interface LegDistance {
  from: string;
  to: string;
  km: number;
}

interface Props {
  cities: City[];
  waypointIds: string[];
  onChange: (ids: string[]) => void;
  outboundLegs?: LegDistance[];
}

export default function ItineraryBuilder({
  cities,
  waypointIds,
  onChange,
  outboundLegs = [],
}: Props) {
  function addStop(cityId: string) {
    if (!cityId || waypointIds.includes(cityId)) return;
    onChange([...waypointIds, cityId]);
  }

  function removeStop(index: number) {
    onChange(waypointIds.filter((_, i) => i !== index));
  }

  function moveStop(index: number, direction: -1 | 1) {
    const next = [...waypointIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function legKmForStop(index: number): number | null {
    const leg = outboundLegs[index];
    return leg?.km ?? null;
  }

  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel>Add stop</InputLabel>
        <Select
          label="Add stop"
          value=""
          onChange={(e) => addStop(e.target.value)}
        >
          {cities.map((city) => (
            <MenuItem key={city.id} value={city.id} disabled={waypointIds.includes(city.id)}>
              {city.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {waypointIds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Add itinerary stops in travel order (e.g. Skardu, then Khunjerab Pass).
        </Typography>
      ) : (
        <Stack spacing={1}>
          {waypointIds.map((id, index) => {
            const city = cities.find((c) => c.id === id);
            const legKm = legKmForStop(index);
            const leg = outboundLegs[index];

            return (
              <Box
                key={`${id}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Chip size="small" label={index + 1} />
                <Box sx={{ flex: 1 }}>
                  <Typography>
                    {city?.name ?? id}
                    {city?.vehicleAccess.length === 1 && city.vehicleAccess[0] === 'jeep' && (
                      <Chip size="small" label="jeep only" color="warning" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  {legKm != null && legKm > 0 && leg && (
                    <Typography variant="caption" color="text.secondary">
                      {legKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km from {leg.from}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" onClick={() => moveStop(index, -1)} disabled={index === 0}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => moveStop(index, 1)}
                  disabled={index === waypointIds.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => removeStop(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
