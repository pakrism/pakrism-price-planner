import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';
import { fetchFuelPrice } from '../../lib/services/fuelPriceFetcher';

export default function FuelPage() {
  const { config, updateConfig } = useConfig();
  const [form, setForm] = useState(config.fuel);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, fuel: form });
    setSaving(false);
    setMessage('Fuel settings saved.');
  }

  async function handleFetch() {
    setFetching(true);
    setMessage('');
    const result = await fetchFuelPrice(form);
    const next = { ...form, manualPricePerLiter: result.pricePerLiter, lastUpdated: result.lastUpdated };
    setForm(next);
    await updateConfig({ ...config, fuel: next });
    setMessage(result.warning ?? `Fetched price: PKR ${result.pricePerLiter}/L`);
    setFetching(false);
  }

  return (
    <ConfigSection title="Fuel Settings" description="Manual price is always the fallback. Online fetch uses ceiling rounding.">
      <Stack spacing={2} sx={{ maxWidth: 520 }}>
        {message && <Alert severity="info">{message}</Alert>}
        <FormControl fullWidth>
          <InputLabel>Fuel type</InputLabel>
          <Select label="Fuel type" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value as 'petrol' | 'diesel' })}>
            <MenuItem value="petrol">Petrol</MenuItem>
            <MenuItem value="diesel">Diesel</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Manual price / liter (PKR)" type="number" value={form.manualPricePerLiter} onChange={(e) => setForm({ ...form, manualPricePerLiter: Number(e.target.value) })} />
        <TextField label="Fetch URL (JSON: { petrol, diesel })" value={form.fetchUrl ?? ''} onChange={(e) => setForm({ ...form, fetchUrl: e.target.value })} helperText="Optional JSON endpoint for live prices" />
        {form.lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(form.lastUpdated).toLocaleString()}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleFetch} disabled={fetching}>{fetching ? 'Fetching…' : 'Fetch latest'}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
