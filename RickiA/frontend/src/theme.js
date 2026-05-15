import { createMuiTheme } from '@mui/material/styles';

export const rickTheme = createMuiTheme({
  palette: {
    primary: {
      main: '#D4AF37', // Rick's gold
      light: '#E8C47F',
      dark: '#B8931F',
    },
    secondary: {
      main: '#ff69b4', // Morty's pink
      light: '#ff92d4',
      dark: '#ff4da6',
    },
    background: {
      default: '#0d1525', // Rick's dark background
      paper: '#1a1a2e',
    },
    text: {
      primary: '#F0EAD6',
      secondary: '#90CAF9',
    },
  },
  typography: {
    fontFamily: ['Cinzel', 'Crimson Text', 'serif'].join(','),
    h1: {
      textShadow: '0 0 10px rgba(212,175,55,0.5)',
    },
    h4: {
      textShadow: '0 0 10px rgba(212,175,55,0.5)',
    },
  },
  shape: {
    borderRadius: 8,
  },
});