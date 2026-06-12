import { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';
import type { City } from '../../lib/pricing/types';

function newCity(): City {
  return { id: `city-${Date.now()}`, name: '', lat: 0, lng: 0 };
}

export default function CitiesPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.cities);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<City>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, cities: items });
    setSaving(false);
  }

  return (
    <ConfigSection title="Cities & Waypoints" description="Used for itinerary selection and Google Maps routing.">
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={item.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="Name" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} fullWidth />
            <TextField label="Lat" type="number" value={item.lat} onChange={(e) => updateItem(index, { lat: Number(e.target.value) })} />
            <TextField label="Lng" type="number" value={item.lng} onChange={(e) => updateItem(index, { lng: Number(e.target.value) })} />
            <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newCity()])}>Add city</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
