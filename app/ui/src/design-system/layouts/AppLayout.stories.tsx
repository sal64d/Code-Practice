import type { Meta, StoryObj } from '@storybook/react';
import { AppLayout } from './AppLayout';
import { BrowserRouter } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const meta = {
  title: 'Design System/Organisms/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const navItems = [
  { to: '/problems', label: 'Problems' },
  { to: '/progress', label: 'Progress' },
  { to: '/submissions', label: 'Submissions' },
];

export const LoggedIn: Story = {
  args: {
    session: {
      usernameKey: 'ada-lovelace',
      displayUsername: 'Ada Lovelace'
    },
    onLogout: () => alert('Logout clicked'),
    navItems,
    children: (
      <Box sx={{ p: 2 }}>
        <Typography variant="h4">Page Content</Typography>
        <Typography color="text.secondary">The main content goes here.</Typography>
      </Box>
    ),
  },
};

export const LoggedOut: Story = {
  args: {
    session: null,
    onLogout: () => {},
    navItems,
    children: (
      <Box sx={{ p: 2 }}>
        <Typography variant="h4">Please log in</Typography>
      </Box>
    ),
  },
};
