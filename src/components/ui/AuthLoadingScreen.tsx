import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export default function AuthLoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
