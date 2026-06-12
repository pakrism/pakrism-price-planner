import { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';
import type { Vehicle } from '../../lib/pricing/types';

function newVehicle(): Vehicle {
  return {
    id: `vehicle-${Date.now()}`,
    name: '',
    avgKmPerLiter: 10,
    perDayRent: 15000,
    capacity: 6,
  };
}

export default function VehiclesPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.vehicles);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<Vehicle>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, vehicles: items });
    setSaving(false);
  }

  return (
    <ConfigSection title="Vehicles" description="Per-day rent and fuel average (km/L) for each vehicle.">
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={item.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="Name" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} fullWidth />
            <TextField label="km/L" type="number" value={item.avgKmPerLiter} onChange={(e) => updateItem(index, { avgKmPerLiter: Number(e.target.value) })} />
            <TextField label="Rent/day" type="number" value={item.perDayRent} onChange={(e) => updateItem(index, { perDayRent: Number(e.target.value) })} />
            <TextField label="Capacity" type="number" value={item.capacity} onChange={(e) => updateItem(index, { capacity: Number(e.target.value) })} />
            <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newVehicle()])}>Add vehicle</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
