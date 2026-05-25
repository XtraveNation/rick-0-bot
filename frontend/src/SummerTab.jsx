import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const SummerTheme = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fff3cd 0%, #ffc107 50%, #ffb300 100%)',
  border: '2px solid #ff9800',
  boxShadow: '0 0 30px rgba(255,152,0,0.3)',
  color: '#333',
  padding: theme.spacing(4),
}));

const ResultCard = styled(Paper)(({ theme }) => ({
  p: 2,
  mt: 2,
  bgcolor: 'rgba(255,152,0,0.1)',
  borderLeft: '4px solid #ff9800',
}));

export default function SummerTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [indexed, setIndexed] = useState(false);

  const indexDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/summer/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['./docs', './backend', './frontend'] })
      });
      const json = await res.json();
      if (json.success) {
        setIndexed(true);
        alert(`Indexed: ${json.summary}`);
      } else {
        setError(json.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/summer/search?q=' + encodeURIComponent(query));
      const json = await res.json();
      if (json.success) {
        setResults(json.results);
      } else {
        setError(json.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SummerTheme elevation={3}>
      <Typography variant="h4" sx={{ color: '#ff9800', mb: 3, fontWeight: 'bold' }}>
        ☀️ Summer - Semantic Search
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={indexDocuments}
          disabled={loading || indexed}
          sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
        >
          {indexed ? '✅ Indexed' : loading ? '⏳ Indexing...' : '📑 Index Documents'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={!indexed}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,152,0,0.05)'
            }
          }}
        />
        <Button 
          variant="contained"
          onClick={handleSearch}
          disabled={!indexed || loading || !query.trim()}
          sx={{ bgcolor: '#ff9800' }}
        >
          {loading ? <CircularProgress size={24} /> : '🔍'}
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" sx={{ color: '#d32f2f', mb: 2 }}>
          ⚠️ {error}
        </Typography>
      )}

      <Box>
        {results.map((result, idx) => (
          <ResultCard key={idx}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
              {result.id}
            </Typography>
            <Typography variant="body2" sx={{ my: 1, color: '#555' }}>
              {result.text}
            </Typography>
            <Chip label={`Score: ${result.score.toFixed(3)}`} size="small" variant="outlined" />
          </ResultCard>
        ))}
      </Box>

      {results.length === 0 && !loading && indexed && (
        <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', mt: 3 }}>
          No results. Try a different search query.
        </Typography>
      )}
    </SummerTheme>
  );
}