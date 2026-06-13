import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import type { AppConfig, HotelNightInput } from '../../lib/pricing/types';
import { getHotelsForCity } from '../../lib/pricing/helpers';

interface Props {
  config: AppConfig;
  value: HotelNightInput[];
  onChange: (value: HotelNightInput[]) => void;
}

const emptyRow = (categories: AppConfig['hotelCategories'], cityId = ''): HotelNightInput => ({
  destinationId: cityId,
  categoryId: categories[0]?.id ?? 'deluxe',
  hotelId: '',
  rooms: 1,
  nights: 1,
});

export default function HotelNightsForm({ config, value, onChange }: Props) {
  function updateRow(index: number, patch: Partial<HotelNightInput>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Stack spacing={2}>
      {value.map((row, index) => {
        const hotels = row.destinationId ? getHotelsForCity(config, row.destinationId) : [];
        return (
          <Stack key={index} spacing={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>Destination</InputLabel>
                <Select
                  label="Destination"
                  value={row.destinationId}
                  onChange={(e) => updateRow(index, { destinationId: e.target.value, hotelId: '' })}
                >
                  {config.cities.filter((c) => c.kind !== 'departure').map((city) => (
                    <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Hotel</InputLabel>
                <Select
                  label="Hotel"
                  value={row.hotelId ?? ''}
                  onChange={(e) => {
                    const hotel = config.hotels.find((h) => h.id === e.target.value);
                    updateRow(index, {
                      hotelId: e.target.value,
                      categoryId: hotel?.categoryId ?? row.categoryId,
                    });
                  }}
                >
                  <MenuItem value="">Category fallback</MenuItem>
                  {hotels.map((hotel) => (
                    <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={row.categoryId}
                  onChange={(e) => updateRow(index, { categoryId: e.target.value })}
                  disabled={Boolean(row.hotelId)}
                >
                  {config.hotelCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Rooms" type="number" slotProps={{ htmlInput: { min: 1 } }} value={row.rooms} onChange={(e) => updateRow(index, { rooms: Number(e.target.value) || 1 })} sx={{ minWidth: 90 }} />
              <TextField label="Nights" type="number" slotProps={{ htmlInput: { min: 1 } }} value={row.nights} onChange={(e) => updateRow(index, { nights: Number(e.target.value) || 1 })} sx={{ minWidth: 90 }} />
              <IconButton color="error" onClick={() => onChange(value.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
            </Stack>
          </Stack>
        );
      })}
      <Button variant="outlined" onClick={() => onChange([...value, emptyRow(config.hotelCategories)])}>
        Add hotel stay
      </Button>
    </Stack>
  );
}
