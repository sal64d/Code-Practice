import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import Typography from '@mui/material/Typography';

const meta = {
  title: 'Design System/Atoms/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Typography variant="h5" component="div" gutterBottom>
          Glassmorphic Card
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This card has a subtle blur backdrop filter defined in the theme.
        </Typography>
      </>
    ),
  },
};
