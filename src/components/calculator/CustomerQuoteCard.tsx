import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Props {
  message: string | null;
}

export default function CustomerQuoteCard({ message }: Props) {
  if (!message) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Calculate a price to generate the customer message.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Customer Message</Typography>
        <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.95rem', m: 0 }}>
          {message}
        </Typography>
        <Button startIcon={<ContentCopyIcon />} variant="outlined" onClick={() => navigator.clipboard.writeText(message)}>
          Copy message
        </Button>
      </Stack>
    </Paper>
  );
}
