import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

export default function TokenBudget({ balance, loading }) {
  const safeBalance = typeof balance === 'number' ? balance : 0;
  const percent = Math.min(100, (safeBalance / 1000) * 100);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ color: '#D4AF37' }}>Token Balance: {loading ? 'Loading...' : safeBalance}</Typography>
      <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)' }} />
      {safeBalance <= 100 && <Typography variant="caption" color="error">Low tokens — consider topping up.</Typography>}
    </Box>
  );
}
