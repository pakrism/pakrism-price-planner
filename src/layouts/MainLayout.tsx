import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useAuth } from '../context/AuthProvider';
import { logoutUser } from '../lib/auth';

export default function MainLayout() {
  const { isAdminUser, profile } = useAuth();
  const location = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 700 }}>
            Pakrism Price Planner
          </Typography>
          <Button component={RouterLink} to="/" color={location.pathname === '/' ? 'primary' : 'inherit'}>
            Calculator
          </Button>
          {isAdminUser && (
            <Button component={RouterLink} to="/admin/vehicles" color={location.pathname.startsWith('/admin') ? 'primary' : 'inherit'}>
              Admin
            </Button>
          )}
          <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
            {profile?.fullName ?? profile?.email}
          </Typography>
          <Button onClick={() => logoutUser()}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
