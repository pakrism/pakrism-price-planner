import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { AppConfig, ParsedRequirement } from '../../lib/pricing/types';
import { parseClientRequirement } from '../../lib/services/aiParser';

interface Props {
  config: AppConfig;
  onParsed: (result: ParsedRequirement) => void;
}

export default function AiRequirementPanel({ config, onParsed }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setWarnings([]);
    try {
      const result = await parseClientRequirement(text, config);
      setWarnings(result.warnings ?? []);
      onParsed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Paste client requirement</Typography>
      <TextField
        multiline
        rows={5}
        placeholder="Paste WhatsApp message from client… e.g. 8 days Skardu Hunza tour for family of 5, deluxe hotels, BRV from Islamabad"
        value={text}
        onChange={(e) => setText(e.target.value)}
        fullWidth
      />
      <Button variant="outlined" startIcon={<AutoFixHighIcon />} onClick={handleParse} disabled={loading || !text.trim()}>
        {loading ? 'Parsing…' : 'Parse with AI'}
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {warnings.length > 0 && (
        <Alert severity="warning">{warnings.join(' · ')}</Alert>
      )}
    </Stack>
  );
}
