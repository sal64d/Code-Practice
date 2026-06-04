import type { Meta, StoryObj } from '@storybook/react';
import { ProblemTable } from './ProblemTable';
import { BrowserRouter } from 'react-router';

const mockProblems = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    supported_languages: ['javascript', 'python'],
    current_published_version_id: 'v1',
  },
  {
    id: '2',
    title: 'Add Two Numbers',
    difficulty: 'medium',
    tags: ['linked-list', 'math'],
    supported_languages: ['javascript'],
    current_published_version_id: 'v1',
  },
  {
    id: '3',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    supported_languages: ['javascript', 'typescript'],
    current_published_version_id: 'v1',
  },
];

const meta = {
  title: 'Layouts/ProblemTable',
  component: ProblemTable,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    problems: mockProblems,
  },
} satisfies Meta<typeof ProblemTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    problems: [],
  },
};
