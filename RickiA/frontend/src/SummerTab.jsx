import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const SummerTheme = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fff3e0 0%, #ffccbc 50%, #ffe0b2 100%)',
  border: '2px solid #ff6b6b',
  boxShadow: '0 0 30px rgba(255,107,107,0.3)',
  color: '#333',
  padding: theme.spacing(4),
}));

function SummerTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch {
      setResults(['Search failed – backend not running.']);
    }
  };

  return (
    <SummerTheme>
      <Typography variant="h4" gutterBottom align="center" sx={{ color: '#ff6b6b', textShadow: '0 0 10px rgba(255,107,107,0.5)' }}>
        🔍 Summer's RAG Search
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Search Knowledge Base"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch} sx={{ bgcolor: '#ff6b6b', color: '#fff' }}>
          Search
        </Button>
        <Box sx={{ mt: 2 }}>
          {results.map((r, i) => (
            <Typography key={i} variant="body2" gutterBottom>
              {r}
            </Typography>
          ))}
        </Box>
      </Box>
    </SummerTheme>
  );
}

export default SummerTab;