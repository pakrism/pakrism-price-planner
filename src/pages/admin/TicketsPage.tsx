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
import type { EntryTicket } from '../../lib/pricing/types';

function newTicket(): EntryTicket {
  return { id: `ticket-${Date.now()}`, name: '', price: 0 };
}

export default function TicketsPage() {
  const { config, updateConfig } = useConfig();
  const [items, setItems] = useState(config.entryTickets);
  const [saving, setSaving] = useState(false);

  function updateItem(index: number, patch: Partial<EntryTicket>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, entryTickets: items });
    setSaving(false);
  }

  return (
    <ConfigSection title="Entry Tickets" description="Forts, resorts, parks, and other entry fees.">
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={item.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="Name" value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} fullWidth />
            <TextField label="Price" type="number" value={item.price} onChange={(e) => updateItem(index, { price: Number(e.target.value) })} />
            <FormControl fullWidth>
              <InputLabel>Destination</InputLabel>
              <Select label="Destination" value={item.destination ?? ''} onChange={(e) => updateItem(index, { destination: e.target.value })}>
                <MenuItem value="">Any</MenuItem>
                {config.cities.map((city) => (
                  <MenuItem key={city.id} value={city.name}>{city.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setItems([...items, newTicket()])}>Add ticket</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </ConfigSection>
  );
}
