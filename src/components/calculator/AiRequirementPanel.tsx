import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import type { AppConfig } from '../../lib/pricing/types';
import { parseClientRequirement, type ParseResult } from '../../lib/services/aiParser';

interface Props {
  config: AppConfig;
  onParsed: (parsed: ParseResult) => void | Promise<void>;
}

export default function AiRequirementPanel({ config, onParsed }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setWarnings([]);
    try {
      const parsed = await parseClientRequirement(text, config);
      setWarnings(parsed.result.warnings ?? []);

      if (parsed.source === 'ai') {
        setSuccess('Parsed with AI — form updated and price calculated.');
      } else {
        setError(parsed.error ?? 'AI unavailable — filled with local rules instead.');
      }

      await onParsed(parsed);
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
      {success && <Alert severity="success">{success}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {warnings.length > 0 && (
        <Alert severity="warning">{warnings.join(' · ')}</Alert>
      )}
    </Stack>
  );
}
