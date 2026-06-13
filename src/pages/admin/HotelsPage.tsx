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
import type { HotelCategory, HotelProperty } from '../../lib/pricing/types';

function newCategory(): HotelCategory {
  return { id: `cat-${Date.now()}`, name: '', defaultPricePerNight: 12000, destinationOverrides: {} };
}

function newHotel(): HotelProperty {
  return { id: `hotel-${Date.now()}`, name: '', cityId: '', categoryId: 'deluxe', pricePerRoomPerNight: 12000 };
}

export default function HotelsPage() {
  const { config, updateConfig } = useConfig();
  const [categories, setCategories] = useState(config.hotelCategories);
  const [hotels, setHotels] = useState(config.hotels ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateConfig({ ...config, hotelCategories: categories, hotels });
    setSaving(false);
  }

  return (
    <Stack spacing={3}>
      <ConfigSection title="Hotel Categories" description="Deluxe, Executive, etc. Used as fallback when no named hotel is selected.">
        <Stack spacing={2}>
          {categories.map((item, index) => (
            <Stack key={item.id} direction="row" spacing={1}>
              <TextField label="Category" value={item.name} onChange={(e) => setCategories(categories.map((c, i) => i === index ? { ...c, name: e.target.value } : c))} fullWidth />
              <TextField label="Default PKR/room/night" type="number" value={item.defaultPricePerNight} onChange={(e) => setCategories(categories.map((c, i) => i === index ? { ...c, defaultPricePerNight: Number(e.target.value) } : c))} />
              <IconButton color="error" onClick={() => setCategories(categories.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
            </Stack>
          ))}
          <Button variant="outlined" onClick={() => setCategories([...categories, newCategory()])}>Add category</Button>
        </Stack>
      </ConfigSection>

      <ConfigSection title="Named Hotels" description="Hotels by location with per-room pricing.">
        <Stack spacing={2}>
          {hotels.map((item, index) => (
            <Stack key={item.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField label="Hotel name" value={item.name} onChange={(e) => setHotels(hotels.map((h, i) => i === index ? { ...h, name: e.target.value } : h))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <Select label="City" value={item.cityId} onChange={(e) => setHotels(hotels.map((h, i) => i === index ? { ...h, cityId: e.target.value } : h))}>
                  {config.cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={item.categoryId} onChange={(e) => setHotels(hotels.map((h, i) => i === index ? { ...h, categoryId: e.target.value } : h))}>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="PKR/room/night" type="number" value={item.pricePerRoomPerNight} onChange={(e) => setHotels(hotels.map((h, i) => i === index ? { ...h, pricePerRoomPerNight: Number(e.target.value) } : h))} />
              <IconButton color="error" onClick={() => setHotels(hotels.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
            </Stack>
          ))}
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setHotels([...hotels, newHotel()])}>Add hotel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save all'}</Button>
          </Stack>
        </Stack>
      </ConfigSection>
    </Stack>
  );
}
