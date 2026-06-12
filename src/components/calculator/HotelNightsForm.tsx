import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import type { City, HotelCategory, HotelNightInput } from '../../lib/pricing/types';

interface Props {
  cities: City[];
  hotelCategories: HotelCategory[];
  value: HotelNightInput[];
  onChange: (value: HotelNightInput[]) => void;
}

const emptyRow = (categories: HotelCategory[]): HotelNightInput => ({
  destinationId: '',
  categoryId: categories[0]?.id ?? '',
  nights: 1,
});

export default function HotelNightsForm({ cities, hotelCategories, value, onChange }: Props) {
  function updateRow(index: number, patch: Partial<HotelNightInput>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Stack spacing={2}>
      {value.map((row, index) => (
        <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
          <FormControl fullWidth>
            <InputLabel>Destination</InputLabel>
            <Select
              label="Destination"
              value={row.destinationId}
              onChange={(e) => updateRow(index, { destinationId: e.target.value })}
            >
              {cities.map((city) => (
                <MenuItem key={city.id} value={city.id}>
                  {city.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={row.categoryId}
              onChange={(e) => updateRow(index, { categoryId: e.target.value })}
            >
              {hotelCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Nights"
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
            value={row.nights}
            onChange={(e) => updateRow(index, { nights: Number(e.target.value) || 1 })}
            sx={{ minWidth: 100 }}
          />
          <IconButton color="error" onClick={() => onChange(value.filter((_, i) => i !== index))}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      ))}
      <Button variant="outlined" onClick={() => onChange([...value, emptyRow(hotelCategories)])}>
        Add hotel stay
      </Button>
    </Stack>
  );
}
