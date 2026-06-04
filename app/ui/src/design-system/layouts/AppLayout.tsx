import React from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { NavLink } from 'react-router';
import type { UsernameSession } from '../../types/session';

export interface AppLayoutProps {
  session: UsernameSession | null;
  onLogout: () => void;
  navItems: { label: string; to: string }[];
  children: React.ReactNode;
}

export function AppLayout({ session, onLogout, navItems, children }: AppLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mr: 2, color: 'primary.main' }}>
            Learn
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  color: 'text.secondary',
                  '&.active': {
                    color: 'text.primary',
                    bgcolor: 'action.selected',
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          {session && (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {session.displayUsername}
              </Typography>
              <Button variant="outlined" size="small" onClick={onLogout} color="inherit" sx={{ borderColor: 'divider' }}>
                Switch user
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  );
}
