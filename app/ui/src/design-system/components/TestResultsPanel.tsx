
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export interface TestResult {
  index: number;
  stdin: string;
  expectedStdout: string;
  actualStdout: string;
  stderr?: string;
  passed: boolean;
  durationMs: number;
  status: 'passed' | 'failed' | 'runtime_error' | 'timeout';
}

export interface RunSummary {
  passed: number;
  total: number;
  durationMs: number;
  stdoutBytes: number;
  results: TestResult[];
}

export interface TestResultsPanelProps {
  summary: RunSummary | null;
}

export function TestResultsPanel({ summary }: TestResultsPanelProps) {
  if (!summary) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Run your code to see results.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Results: {summary.passed} / {summary.total} passed
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Duration: {summary.durationMs}ms | Output: {summary.stdoutBytes} bytes
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
              Test Case {i + 1}: {r.status.toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>Input:</Typography>
            <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto' }}>
              {r.stdin}
            </Box>

            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>Expected Output:</Typography>
            <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto' }}>
              {r.expectedStdout}
            </Box>

            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>Actual Output:</Typography>
            <Box component="pre" sx={{ m: 0, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.8rem', overflowX: 'auto' }}>
              {r.actualStdout || '(no output)'}
            </Box>

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
