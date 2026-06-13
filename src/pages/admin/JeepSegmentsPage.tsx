import { useState } from 'react';
import Button from '@mui/material/Button';
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
import type { JeepSegment } from '../../lib/pricing/types';

function newSegment(): JeepSegment {
  return { id: `jeep-${Date.now()}`, name: '', cityId: '', pricePerJeep: 15000, capacity: 5, defaultDays: 1 };
}

export default function JeepSegmentsPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.jeepSegments ?? []);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<JeepSegment>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, jeepSegments: items });
    setSaving(false);
  }

  return (
    <ConfigSection title="Jeep Segments" description="Off-road jeep add-ons (Deosai, Fairy Meadows, etc.) priced per jeep per day.">
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={item.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="Name" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Linked stop</InputLabel>
              <Select label="Linked stop" value={item.cityId} onChange={(e) => updateItem(index, { cityId: e.target.value })}>
                {config.cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="PKR/jeep" type="number" value={item.pricePerJeep} onChange={(e) => updateItem(index, { pricePerJeep: Number(e.target.value) })} />
            <TextField label="Capacity" type="number" value={item.capacity} onChange={(e) => updateItem(index, { capacity: Number(e.target.value) })} />
            <TextField label="Default days" type="number" value={item.defaultDays} onChange={(e) => updateItem(index, { defaultDays: Number(e.target.value) })} />
            <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newSegment()])}>Add jeep segment</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
