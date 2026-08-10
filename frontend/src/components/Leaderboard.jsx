import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid } from '@mui/material';

// Truncates a session_id for display (e.g. "session-demo-1234567" -> "session-…4567").
function truncateSessionId(sessionId) {
  if (!sessionId) return '';
  if (sessionId.length <= 16) return sessionId;
  return `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`;
}

export default function Leaderboard({ leaderboard, stats, loading, error }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ color: '#D4AF37', mb: 1 }}>
        🏆 Token Leaderboard
      </Typography>
      <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 2 }}>
        Ranked by session (no user accounts yet — each row is a session_id, not a person).
      </Typography>

      {error && (
        <Typography variant="body2" sx={{ color: '#ff6b6b', mb: 2 }}>
          ⚠️ {error}
        </Typography>
      )}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>{stats.total_tokens}</Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Total Tokens Consumed</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                {Number.isFinite(stats.average_tokens_per_session) ? stats.average_tokens_per_session.toFixed(1) : '0'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Avg Tokens / Session</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>{stats.total_sessions}</Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Active Sessions</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Session</TableCell>
              <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }} align="right">Total Tokens</TableCell>
              <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }} align="right">Messages</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: '#b0b0b0' }}>Loading…</TableCell>
              </TableRow>
            )}
            {!loading && leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: '#b0b0b0' }}>
                  No token usage recorded yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && leaderboard.map((row, i) => (
              <TableRow key={row.session_id}>
                <TableCell sx={{ color: '#F0EAD6' }}>#{i + 1}</TableCell>
                <TableCell sx={{ color: '#F0EAD6', fontFamily: 'monospace' }} title={row.session_id}>
                  {truncateSessionId(row.session_id)}
                </TableCell>
                <TableCell sx={{ color: '#81C784' }} align="right">{row.total_tokens}</TableCell>
                <TableCell sx={{ color: '#90CAF9' }} align="right">{row.message_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
