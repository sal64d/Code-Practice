import type { Meta, StoryObj } from '@storybook/react';
import { LoginPageLayout } from './LoginPageLayout';

const meta = {
  title: 'Layouts/LoginPageLayout',
  component: LoginPageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    username: '',
    isLoggingIn: false,
    loginError: null,
    isSupabaseConfigured: true,
    onUsernameChange: () => {},
    onSubmit: (e) => e.preventDefault(),
  },
  argTypes: {
    onUsernameChange: { action: 'username changed' },
    onSubmit: { action: 'form submitted' },
  },
} satisfies Meta<typeof LoginPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    username: '',
  },
};

export const WithUsername: Story = {
  args: {
    username: 'ada-lovelace',
  },
};

export const LoggingIn: Story = {
  args: {
    username: 'ada-lovelace',
    isLoggingIn: true,
  },
};

export const WithError: Story = {
  args: {
    username: 'ada-lovelace',
    loginError: 'User not found. Please try again.',
  },
};

export const SupabaseNotConfigured: Story = {
  args: {
    isSupabaseConfigured: false,
  },
};
