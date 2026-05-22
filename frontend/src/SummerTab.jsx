import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const SummerTheme = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fff3e0 0%, #ffccbc 50%, #ffe0b2 100%)',
  border: '2px solid #ff6b6b',
  boxShadow: '0 0 30px rgba(255,107,107,0.3)',
  color: '#333',
  padding: theme.spacing(4),
}));

function SummerTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);

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
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    }
  };

  const handleUpload = async () => {
    if (!uploadText.trim()) return;
    try {
      setUploading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadText, metadata: { source: 'user_upload' } }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Document added to knowledge base!');
        setUploadText('');
      } else {
        alert('Failed to add document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SummerTheme elevation={3}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Add Document to Knowledge Base"
            variant="outlined"
            value={uploadText}
            onChange={(e) => setUploadText(e.target.value)}
          />
          <Button variant="contained" onClick={handleUpload} disabled={uploading} sx={{ bgcolor: '#2196f3', color: '#fff' }}>
            {uploading ? 'Uploading...' : 'Add Document'}
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          {results.map((r, i) => (
            <Paper key={i} sx={{ p: 3, mb: 2, bgcolor: 'rgba(255,107,107,0.1)' }}>
              <Typography variant="body2" gutterBottom>
                <strong>Score:</strong> {r.score.toFixed(4)}
              </Typography>
              <Typography variant="body1">{r.text}</Typography>
              <Typography variant="caption" color="text.secondary">{JSON.stringify(r.metadata)}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </SummerTheme>
  );
}

export default SummerTab;