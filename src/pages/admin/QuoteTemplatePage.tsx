import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ConfigSection from '../../components/admin/ConfigSection';
import { useConfig } from '../../context/ConfigProvider';
import type { QuoteSettings } from '../../lib/pricing/types';

export default function QuoteTemplatePage() {
  const { config, updateConfig } = useConfig();
  const [form, setForm] = useState<QuoteSettings>(config.quoteSettings);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, quoteSettings: form });
    setSaving(false);
  }

  return (
    <ConfigSection title="Quote Template" description="Default inclusions and exclusions for customer WhatsApp messages.">
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        <TextField label="Departure line" value={form.departureLine} onChange={(e) => setForm({ ...form, departureLine: e.target.value })} fullWidth />
        <Typography variant="subtitle2">Inclusions (one per line)</Typography>
        <TextField multiline rows={6} value={form.inclusions.join('\n')} onChange={(e) => setForm({ ...form, inclusions: e.target.value.split('\n').filter(Boolean) })} fullWidth />
        <Typography variant="subtitle2">Exclusions (one per line)</Typography>
        <TextField multiline rows={4} value={form.exclusions.join('\n')} onChange={(e) => setForm({ ...form, exclusions: e.target.value.split('\n').filter(Boolean) })} fullWidth />
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start' }}>{saving ? 'Saving…' : 'Save'}</Button>
      </Stack>
    </ConfigSection>
  );
}
