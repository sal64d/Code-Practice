import { createTheme } from '@mui/material/styles';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#aa3bff',
    },
    background: {
      default: '#16171d',
      paper: 'rgba(31, 32, 40, 0.7)',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
    },
    divider: '#2e303a',
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#16171d',
          minHeight: '100svh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.5rem',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: 'rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid #2e303a',
          boxShadow: 'rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: '#2e303a',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(170, 59, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#aa3bff',
            },
          },
        },
      },
    },
  },
});
