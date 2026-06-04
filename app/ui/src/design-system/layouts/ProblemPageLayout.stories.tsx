import type { Meta, StoryObj } from '@storybook/react';
import { ProblemPageLayout } from './ProblemPageLayout';
import ReactMarkdown from 'react-markdown';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const mockMdx = `
# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:

\`\`\`javascript
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`
`;

const MockEditor = () => (
  <Box sx={{ p: 2, height: '100%', bgcolor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace' }}>
    <Typography variant="body2" component="pre" sx={{ m: 0 }}>
{`function twoSum(nums, target) {
  // Write your code here
}`}
    </Typography>
  </Box>
);

const MockResults = () => (
  <Box sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6">Test Results</Typography>
    <Typography color="success.main" variant="body2">3 / 3 test cases passed.</Typography>
  </Box>
);

const meta = {
  title: 'Layouts/ProblemPageLayout',
  component: ProblemPageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    title: 'Two Sum',
    difficulty: 'easy',
    versionNumber: 1,
    mdxContent: <ReactMarkdown>{mockMdx}</ReactMarkdown>,
    editor: <MockEditor />,
    results: <MockResults />,
    isRunning: false,
    isSubmitting: false,
    submitError: '',
    onRun: () => {},
    onSubmit: () => {},
  },
  argTypes: {
    onRun: { action: 'run clicked' },
    onSubmit: { action: 'submit clicked' },
  },
} satisfies Meta<typeof ProblemPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Running: Story = {
  args: {
    isRunning: true,
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const WithError: Story = {
  args: {
    submitError: 'Failed to submit code. Please try again.',
  },
};

export const HardDifficulty: Story = {
  args: {
    difficulty: 'hard',
  },
};
