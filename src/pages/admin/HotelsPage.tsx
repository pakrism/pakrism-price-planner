import { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';
import type { HotelCategory } from '../../lib/pricing/types';

function newCategory(): HotelCategory {
  return { id: `hotel-${Date.now()}`, name: '', defaultPricePerNight: 12000, destinationOverrides: {} };
}

export default function HotelsPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.hotelCategories);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<HotelCategory>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateOverride(catIndex: number, dest: string, value: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === catIndex
          ? { ...item, destinationOverrides: { ...item.destinationOverrides, [dest]: value } }
          : item,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, hotelCategories: items });
    setSaving(false);
  }

  return (
    <ConfigSection title="Hotel Categories" description="Deluxe, Executive, and per-destination overrides.">
      <Stack spacing={3}>
        {items.map((item, index) => (
          <Stack key={item.id} spacing={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" spacing={1}>
              <TextField label="Category" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} fullWidth />
              <TextField label="Default/night" type="number" value={item.defaultPricePerNight} onChange={(e) => updateItem(index, { defaultPricePerNight: Number(e.target.value) })} />
              <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                <DeleteIcon />
              </IconButton>
            </Stack>
            <Typography variant="caption" color="text.secondary">Destination overrides (PKR/night)</Typography>
            {config.cities.map((city) => (
              <TextField
                key={city.id}
                size="small"
                label={city.name}
                type="number"
                value={item.destinationOverrides[city.name] ?? ''}
                placeholder={String(item.defaultPricePerNight)}
                onChange={(e) => updateOverride(index, city.name, Number(e.target.value))}
              />
            ))}
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newCategory()])}>Add category</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
