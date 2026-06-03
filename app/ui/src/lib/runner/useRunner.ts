import { useState, useCallback } from 'react'

export interface TestCase {
  stdin: string
  expectedStdout: string
}

export interface TestResult {
  index: number
  stdin: string
  expectedStdout: string
  actualStdout: string
  stderr?: string
  passed: boolean
  durationMs: number
  status: 'passed' | 'failed' | 'runtime_error' | 'timeout'
}

export interface RunSummary {
  passed: number
  total: number
  durationMs: number
  stdoutBytes: number
  results: TestResult[]
}

const TIMEOUT_MS = 2000

export function useRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null)

  const runCode = useCallback(async (code: string, testCases: TestCase[]) => {
    setIsRunning(true)
    setRunSummary(null)

    const results: TestResult[] = []
    let totalDuration = 0
    let totalStdoutBytes = 0
    let passedCount = 0

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i]
      
      const result = await new Promise<TestResult>((resolve) => {
        // Instantiate a new worker for each test case
        const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
        
        let timeoutId: any

        worker.onmessage = (e) => {
          clearTimeout(timeoutId)
          const data = e.data
          const actualStdout = (data.stdout || '').replace(/\r\n/g, '\n').trim()
          const expectedStdout = tc.expectedStdout.replace(/\r\n/g, '\n').trim()

          const passed = data.type === 'success' && actualStdout === expectedStdout

          let status: TestResult['status'] = 'failed'
          if (data.type === 'error') status = 'runtime_error'
          else if (passed) status = 'passed'

          resolve({
            index: i,
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
            actualStdout,
            stderr: data.stderr,
            passed,
            status,
            durationMs: data.durationMs || 0,
          })
          
          totalStdoutBytes += data.stdoutBytes || 0
          worker.terminate()
        }

        worker.postMessage({ code, stdin: tc.stdin })

        timeoutId = setTimeout(() => {
          worker.terminate()
          resolve({
            index: i,
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
            actualStdout: '',
            stderr: 'Execution timed out',
            passed: false,
            status: 'timeout',
            durationMs: TIMEOUT_MS,
          })
        }, TIMEOUT_MS)
      })

      results.push(result)
      totalDuration += result.durationMs
      if (result.passed) passedCount++
    }

    const summary: RunSummary = {
      passed: passedCount,
      total: testCases.length,
      durationMs: totalDuration,
      stdoutBytes: totalStdoutBytes,
      results,
    }

    setRunSummary(summary)
    setIsRunning(false)
    return summary
  }, [])

  return { runCode, isRunning, runSummary }
}
