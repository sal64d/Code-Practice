
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

import type { RunnerMode } from '../../lib/runner/types';

export interface TestResult {
  index: number;
  name?: string;
  mode: RunnerMode;
  inputDisplay: string;
  expectedDisplay: string;
  actualDisplay: string;
  debugOutput?: string;
  stderr?: string;
  passed: boolean;
  durationMs: number;
  status: 'passed' | 'failed' | 'runtime_error' | 'timeout';
}

export interface RunSummary {
  mode: RunnerMode;
  passed: number;
  total: number;
  durationMs: number;
  stdoutBytes: number;
  results: TestResult[];
}

export interface TestResultsPanelProps {
  summary: RunSummary | null;
  mode?: RunnerMode;
}

export function TestResultsPanel({ summary, mode = 'script' }: TestResultsPanelProps) {
  if (!summary) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Run your code to see results.</Typography>
      </Box>
    );
  }

  const isFunctionMode = (summary.mode ?? mode) === 'function';

  return (
    <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Results: {summary.passed} / {summary.total} passed
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Duration: {summary.durationMs}ms
        {isFunctionMode
          ? ' | Return value is judged; console.log is debug-only (local result, not verified judging).'
          : ' | Local stdout result, not verified judging.'}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {summary.results.map((r, i) => (
          <Paper
            key={i}
            variant="outlined"
            sx={{
              p: 2,
              borderColor: r.passed ? 'success.dark' : 'error.dark',
              bgcolor: r.passed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: r.passed ? 'success.main' : 'error.main', mb: 1 }}
            >
              {r.name ?? `Test Case ${i + 1}`}: {r.status.toUpperCase()}
            </Typography>

            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>Input:</Typography>
            <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {r.inputDisplay}
            </Box>

            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
              {isFunctionMode ? 'Expected return:' : 'Expected output:'}
            </Typography>
            <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto' }}>
              {r.expectedDisplay}
            </Box>

            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
              {isFunctionMode ? 'Actual return:' : 'Actual output:'}
            </Typography>
            <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto' }}>
              {r.actualDisplay || (isFunctionMode ? 'undefined' : '(no output)')}
            </Box>

            {r.debugOutput && (
              <>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>Debug output (console.log):</Typography>
                <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {r.debugOutput}
                </Box>
              </>
            )}

            {r.stderr && (
              <>
                <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 'bold' }}>Error:</Typography>
                <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'rgba(244, 67, 54, 0.2)', color: '#ffcdd2', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto' }}>
                  {r.stderr}
                </Box>
              </>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
