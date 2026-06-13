import { useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';
import type { City, CityKind, VehicleAccess } from '../../lib/pricing/types';

const ACCESS_OPTIONS: VehicleAccess[] = ['car', 'van', 'coaster', 'jeep'];

function newCity(): City {
  return {
    id: `city-${Date.now()}`,
    name: '',
    lat: 0,
    lng: 0,
    kind: 'stop',
    vehicleAccess: ['car', 'van', 'coaster'],
    region: 'GB',
  };
}

export default function CitiesPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.cities);
  const [filter, setFilter] = useState<'all' | CityKind>('all');
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((city) => filter === 'all' || city.kind === filter || (filter === 'departure' && city.kind === 'both'));

  function updateItem(index: number, patch: Partial<City>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function toggleAccess(index: number, access: VehicleAccess) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const has = item.vehicleAccess.includes(access);
        return {
          ...item,
          vehicleAccess: has
            ? item.vehicleAccess.filter((a) => a !== access)
            : [...item.vehicleAccess, access],
        };
      }),
    );
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, cities: items });
    setSaving(false);
  }

  return (
    <ConfigSection
      title="Cities & Stops"
      description="Departure cities and itinerary stops. Tag vehicle access (jeep-only for off-road areas)."
    >
      <Stack spacing={2}>
        <FormControl sx={{ maxWidth: 220 }}>
          <InputLabel>Filter</InputLabel>
          <Select label="Filter" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="departure">Departure</MenuItem>
            <MenuItem value="stop">Stops</MenuItem>
            <MenuItem value="both">Both</MenuItem>
          </Select>
        </FormControl>

        {filtered.map((item) => {
          const index = items.indexOf(item);
          return (
            <Stack key={item.id} spacing={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <TextField label="Name" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} fullWidth />
                <FormControl sx={{ minWidth: 140 }}>
                  <InputLabel>Kind</InputLabel>
                  <Select label="Kind" value={item.kind} onChange={(e) => updateItem(index, { kind: e.target.value as CityKind })}>
                    <MenuItem value="departure">Departure</MenuItem>
                    <MenuItem value="stop">Stop</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Region" value={item.region ?? ''} onChange={(e) => updateItem(index, { region: e.target.value })} />
                <TextField label="Lat" type="number" value={item.lat} onChange={(e) => updateItem(index, { lat: Number(e.target.value) })} />
                <TextField label="Lng" type="number" value={item.lng} onChange={(e) => updateItem(index, { lng: Number(e.target.value) })} />
                <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                {ACCESS_OPTIONS.map((access) => (
                  <Chip
                    key={access}
                    label={access}
                    color={item.vehicleAccess.includes(access) ? 'primary' : 'default'}
                    variant={item.vehicleAccess.includes(access) ? 'filled' : 'outlined'}
                    onClick={() => toggleAccess(index, access)}
                    size="small"
                  />
                ))}
              </Stack>
            </Stack>
          );
        })}

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newCity()])}>Add city</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
