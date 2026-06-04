import type { Meta, StoryObj } from '@storybook/react';
import { EditorContainer } from './EditorContainer';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const meta = {
  title: 'Design System/Molecules/EditorContainer',
  component: EditorContainer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EditorContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: '#c586c0' }}>const</Typography>
        <Typography sx={{ color: '#9cdcfe', display: 'inline' }}> editorContainer </Typography>
        <Typography sx={{ color: '#d4d4d4', display: 'inline' }}>=</Typography>
        <Typography sx={{ color: '#ce9178', display: 'inline' }}> "works"</Typography>
        <Typography sx={{ color: '#d4d4d4', display: 'inline' }}>;</Typography>
      </Box>
    ),
  },
};
