import type { RunSummary } from '../lib/runner/useRunner.ts'

export function TestResults({ summary }: { summary: RunSummary | null }) {
  if (!summary) {
    return <div style={{ padding: '1rem', color: '#666' }}>Run your code to see results.</div>
  }

  return (
    <div style={{ padding: '1rem', overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>
        Results: {summary.passed} / {summary.total} passed
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Duration: {summary.durationMs}ms | Output: {summary.stdoutBytes} bytes
      </p>

      {summary.results.map((r, i) => (
        <div
          key={i}
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            border: `1px solid ${r.passed ? '#4caf50' : '#f44336'}`,
            borderRadius: '4px',
            backgroundColor: r.passed ? '#e8f5e9' : '#ffebee',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: r.passed ? '#2e7d32' : '#c62828' }}>
            Test Case {i + 1}: {r.status.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Input:</strong>
            <pre style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#fff' }}>{r.stdin}</pre>

            <strong>Expected Output:</strong>
            <pre style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#fff' }}>{r.expectedStdout}</pre>

            <strong>Actual Output:</strong>
            <pre style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#fff' }}>{r.actualStdout || '(no output)'}</pre>

            {r.stderr && (
              <>
                <strong>Error:</strong>
                <pre style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#ffcdd2', color: '#b71c1c' }}>
                  {r.stderr}
                </pre>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
