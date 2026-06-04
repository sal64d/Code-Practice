import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Design System/Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'boolean' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'e.g. ada-lovelace',
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    error: true,
    helperText: 'Username is required',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Username',
    disabled: true,
    value: 'grace-hopper',
  },
};
