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
import type { DistanceLeg } from '../../lib/pricing/types';

function newLeg(cities: { id: string }[]): DistanceLeg {
  return { from: cities[0]?.id ?? '', to: cities[1]?.id ?? '', km: 0 };
}

export default function DistanceMatrixPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.distanceLegs);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<DistanceLeg>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, distanceLegs: items });
    setSaving(false);
  }

  return (
    <ConfigSection title="Distance Matrix" description="Fallback distances when Google Maps is unavailable.">
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={`${item.from}-${item.to}-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <FormControl fullWidth>
              <InputLabel>From</InputLabel>
              <Select label="From" value={item.from} onChange={(e) => updateItem(index, { from: e.target.value })}>
                {config.cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>To</InputLabel>
              <Select label="To" value={item.to} onChange={(e) => updateItem(index, { to: e.target.value })}>
                {config.cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Km" type="number" value={item.km} onChange={(e) => updateItem(index, { km: Number(e.target.value) })} />
            <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newLeg(config.cities)])}>Add leg</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
