import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';

export default function ProvisionsPage() {
  const { config, updateConfig } = useConfig();
  const [form, setForm] = useState(config.provisions);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, provisions: form });
    setSaving(false);
  }

  return (
    <ConfigSection title="Travel Provisions" description="Driver, tolls, tax, buffer km, and default margin.">
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <TextField label="Driver cost / day (PKR)" type="number" value={form.driverPerDay} onChange={(e) => setForm({ ...form, driverPerDay: Number(e.target.value) })} />
        <TextField label="Default tolls (PKR)" type="number" value={form.tolls} onChange={(e) => setForm({ ...form, tolls: Number(e.target.value) })} />
        <TextField label="Tax %" type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
        <TextField label="Default buffer km" type="number" value={form.defaultBufferKm} onChange={(e) => setForm({ ...form, defaultBufferKm: Number(e.target.value) })} helperText="50–100 km recommended" />
        <TextField label="Default margin %" type="number" value={form.defaultMarginPercent} onChange={(e) => setForm({ ...form, defaultMarginPercent: Number(e.target.value) })} />
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start' }}>{saving ? 'Saving…' : 'Save'}</Button>
      </Stack>
    </ConfigSection>
  );
}
