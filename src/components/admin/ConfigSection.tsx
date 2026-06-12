import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export default function ConfigSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <BoxHeader title={title} description={description} />
        {children}
      </Stack>
    </Paper>
  );
}

function BoxHeader({ title, description }: { title: string; description?: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Stack>
  );
}
