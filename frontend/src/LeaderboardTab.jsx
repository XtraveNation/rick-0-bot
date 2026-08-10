import React from 'react';
import { Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import Leaderboard from './components/Leaderboard';
import useLeaderboard from './hooks/useLeaderboard';

const LeaderboardTheme = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0d1525 0%, #1a1a2e 50%, #16213e 100%)',
  border: '2px solid #D4AF37',
  boxShadow: '0 0 30px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(212, 175, 55, 0.1)',
  color: '#F0EAD6',
  padding: theme.spacing(4),
}));

function LeaderboardTab() {
  const { leaderboard, stats, loading, error } = useLeaderboard(10);

  return (
    <LeaderboardTheme elevation={3}>
      <Typography variant="h4" gutterBottom align="center" sx={{ color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
        📊 Token Leaderboard
      </Typography>
      <Leaderboard leaderboard={leaderboard} stats={stats} loading={loading} error={error} />
    </LeaderboardTheme>
  );
}

export default LeaderboardTab;
