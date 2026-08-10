import { useState, useEffect, useCallback } from 'react';

export default function useLeaderboard(limit = 10) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tokens/leaderboard?limit=${encodeURIComponent(limit)}&includeStats=true`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch leaderboard');
      }
      setLeaderboard(json.leaderboard || []);
      setStats(json.stats || null);
    } catch (e) {
      console.warn('Failed to fetch token leaderboard', e);
      setError(e.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return { leaderboard, stats, loading, error, fetchLeaderboard };
}
