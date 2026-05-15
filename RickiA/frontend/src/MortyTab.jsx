import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const MortyTheme = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 50%, #ffffff 100%)',
  border: '2px solid #ff69b4',
  boxShadow: '0 0 30px rgba(255, 105, 180, 0.3)',
  color: '#333',
  padding: theme.spacing(4),
}));

function MortyTab() {
  const tasks = [
    { name: 'Fetch Paint', action: 'fetch_paint' },
    { name: 'Get Palette', action: 'get_palette' },
    { name: 'Setup Canvas', action: 'setup_canvas' },
    { name: 'Mix Colors', action: 'mix_colors' },
    { name: 'Clean Brushes', action: 'clean_brushes' },
  ];

  const handleTask = async (action) => {
    try {
      const response = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      alert(`Task ${action} completed: ${data.result}`);
    } catch (error) {
      alert('Task failed — backend not running!');
    }
  };

  return (
    <MortyTheme>
      <Typography variant="h4" gutterBottom align="center" sx={{ color: '#ff69b4', textShadow: '0 0 10px rgba(255,105,180,0.5)' }}>
        🤖 Morty's Task Automation
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tasks.map((task) => (
          <Button
            key={task.name}
            variant="contained"
            onClick={() => handleTask(task.action)}
            sx={{
              width: '100%',
              bgcolor: '#ff69b4',
              color: '#fff',
              '&:hover': { bgcolor: '#ff4da6' },
              '&:active': { transform: 'scale(0.98)' },
            }}
          >
            {task.name}
          </Button>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Morty will handle these tasks automatically when Rick requests them.
      </Typography>
    </MortyTheme>
  );
}

export default MortyTab;