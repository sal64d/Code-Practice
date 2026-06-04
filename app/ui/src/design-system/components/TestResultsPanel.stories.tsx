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

export const FunctionModeResults: Story = {
  args: {
    mode: 'function',
    summary: {
      mode: 'function',
      passed: 1,
      total: 2,
      durationMs: 45,
      stdoutBytes: 120,
      results: [
        {
          index: 0,
          name: 'sample 1',
          mode: 'function',
          inputDisplay: 'nums = [2,7,11,15]\ntarget = 9',
          expectedDisplay: '[0,1]',
          actualDisplay: '[0,1]',
          debugOutput: 'checking map',
          passed: true,
          status: 'passed',
          durationMs: 12,
        },
        {
          index: 1,
          name: 'sample 2',
          mode: 'function',
          inputDisplay: 'nums = [3,2,4]\ntarget = 6',
          expectedDisplay: '[1,2]',
          actualDisplay: '[0,2]',
          passed: false,
          status: 'failed',
          durationMs: 33,
        },
      ],
    },
  },
};

export const ScriptModeResults: Story = {
  args: {
    mode: 'script',
    summary: {
      mode: 'script',
      passed: 1,
      total: 1,
      durationMs: 20,
      stdoutBytes: 8,
      results: [
        {
          index: 0,
          mode: 'script',
          inputDisplay: 'hello',
          expectedDisplay: 'hello',
          actualDisplay: 'hello',
          passed: true,
          status: 'passed',
          durationMs: 20,
        },
      ],
    },
  },
};
