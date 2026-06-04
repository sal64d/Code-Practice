import type { Meta, StoryObj } from '@storybook/react';
import { TestResultsPanel } from './TestResultsPanel';

const meta = {
  title: 'Design System/Molecules/TestResultsPanel',
  component: TestResultsPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TestResultsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    summary: null,
  },
};

export const WithResults: Story = {
  args: {
    summary: {
      passed: 1,
      total: 2,
      durationMs: 45,
      stdoutBytes: 120,
      results: [
        {
          index: 0,
          stdin: '[2,7,11,15]\n9',
          expectedStdout: '[0,1]',
          actualStdout: '[0,1]',
          passed: true,
          status: 'passed',
          durationMs: 12,
        },
        {
          index: 1,
          stdin: '[3,2,4]\n6',
          expectedStdout: '[1,2]',
          actualStdout: '[0,2]',
          stderr: 'Wrong answer',
          passed: false,
          status: 'failed',
          durationMs: 33,
        }
      ]
    }
  },
};
