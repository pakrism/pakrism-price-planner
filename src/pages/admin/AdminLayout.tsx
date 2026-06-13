import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const tabs = [
  { to: '/admin/vehicles', label: 'Vehicles' },
  { to: '/admin/cities', label: 'Cities' },
  { to: '/admin/jeeps', label: 'Jeeps' },
  { to: '/admin/distances', label: 'Distances' },
  { to: '/admin/hotels', label: 'Hotels' },
  { to: '/admin/tickets', label: 'Tickets' },
  { to: '/admin/provisions', label: 'Provisions' },
  { to: '/admin/fuel', label: 'Fuel' },
  { to: '/admin/quote', label: 'Quote' },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Admin Settings
        </Typography>
        <Typography color="text.secondary">
          Manage default values used by the road package calculator.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
        {tabs.map((tab) => (
          <Button
            key={tab.to}
            component={RouterLink}
            to={tab.to}
            variant={location.pathname === tab.to ? 'contained' : 'outlined'}
            size="small"
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
      <Outlet />
    </Stack>
  );
}
