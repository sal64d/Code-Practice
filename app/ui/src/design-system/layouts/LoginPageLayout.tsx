import { type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export interface LoginPageLayoutProps {
  username: string;
  onUsernameChange: (val: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoggingIn: boolean;
  loginError: string | null;
  isSupabaseConfigured: boolean;
}

export function LoginPageLayout({
  username,
  onUsernameChange,
  onSubmit,
  isLoggingIn,
  loginError,
  isSupabaseConfigured,
}: LoginPageLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(170, 59, 255, 0.15), transparent 60%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Sign in with username
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Prototype only: anyone who knows a username can reuse it. There is no password
          and no secure identity guarantee.
        </Typography>

        {!isSupabaseConfigured && (
          <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="error.main" gutterBottom>Configuration Error</Typography>
            <Typography variant="body2" color="error.main">
              Supabase is not configured. Add env vars in app/ui/.env.local.
            </Typography>
          </Box>
        )}

        <form onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Input
              id="username"
              name="username"
              label="Username"
              type="text"
              autoComplete="username"
              autoFocus
              disabled={!isSupabaseConfigured || isLoggingIn}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="e.g. ada-lovelace"
              error={!!loginError}
              helperText={loginError}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={!isSupabaseConfigured || isLoggingIn}
              isLoading={isLoggingIn}
            >
              Continue
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
}
