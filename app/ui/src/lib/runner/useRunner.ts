import { useState, useCallback } from 'react'

import { serializeValue, valuesMatch } from './outputCompare.ts'
import type { ResolvedTestCase, RunOptions, RunSummary, TestResult, WorkerRequest, WorkerResponse } from './types.ts'

const DEFAULT_TIMEOUT_MS = 2000

export function useRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null)

  const runCode = useCallback(async (code: string, options: RunOptions) => {
    setIsRunning(true)
    setRunSummary(null)

    const timeoutMs = options.limits?.timeMs ?? DEFAULT_TIMEOUT_MS
    const results: TestResult[] = []
    let totalDuration = 0
    let totalOutputBytes = 0
    let passedCount = 0

    for (let i = 0; i < options.tests.length; i++) {
      const testCase = options.tests[i]
      const result = await runSingleTest(code, testCase, options, timeoutMs, i)
      results.push(result)
      totalDuration += result.durationMs
      totalOutputBytes += result.debugOutput?.length ?? result.actualDisplay.length
      if (result.passed) passedCount++
    }

    const summary: RunSummary = {
      mode: options.runner.mode,
      passed: passedCount,
      total: options.tests.length,
      durationMs: totalDuration,
      stdoutBytes: totalOutputBytes,
      results,
    }

    setRunSummary(summary)
    setIsRunning(false)
    return summary
  }, [])

  return { runCode, isRunning, runSummary }
}

async function runSingleTest(
  code: string,
  testCase: ResolvedTestCase,
  options: RunOptions,
  timeoutMs: number,
  index: number,
): Promise<TestResult> {
  const workerRequest: WorkerRequest = {
    mode: testCase.mode,
    code,
    stdin: testCase.stdin,
    entrypoint: options.runner.entrypoint,
    args: testCase.args,
  }

  const workerResult = await new Promise<WorkerResponse>((resolve) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    let timeoutId: ReturnType<typeof setTimeout>

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeoutId)
      resolve(event.data)
      worker.terminate()
    }

    worker.postMessage(workerRequest)

    timeoutId = setTimeout(() => {
      worker.terminate()
      resolve({
        type: 'error',
        stderr: 'Execution timed out',
        durationMs: timeoutMs,
        stdoutBytes: 0,
      })
    }, timeoutMs)
  })

  return buildTestResult(testCase, workerResult, index)
}

function buildTestResult(
  testCase: ResolvedTestCase,
  workerResult: WorkerResponse,
  index: number,
): TestResult {
  if (workerResult.type === 'error') {
    return {
      index,
      name: testCase.name,
      mode: testCase.mode,
      inputDisplay: testCase.inputDisplay,
      expectedDisplay: testCase.expectedDisplay,
      actualDisplay: '',
      debugOutput: workerResult.debugOutput,
      stderr: workerResult.stderr,
      passed: false,
      status: workerResult.stderr === 'Execution timed out' ? 'timeout' : 'runtime_error',
      durationMs: workerResult.durationMs,
    }
  }

  if (testCase.mode === 'function') {
    const actualDisplay = serializeValue(workerResult.returnValue)
    const passed = valuesMatch(workerResult.returnValue, testCase.expected, testCase.compare)

    return {
      index,
      name: testCase.name,
      mode: 'function',
      inputDisplay: testCase.inputDisplay,
      expectedDisplay: testCase.expectedDisplay,
      actualDisplay,
      debugOutput: workerResult.debugOutput,
      passed,
      status: passed ? 'passed' : 'failed',
      durationMs: workerResult.durationMs,
    }
  }

  const actualStdout = (workerResult.stdout || '').replace(/\r\n/g, '\n').trim()
  const expectedStdout = (testCase.expectedStdout || '').replace(/\r\n/g, '\n').trim()
  const passed = actualStdout === expectedStdout

  return {
    index,
    name: testCase.name,
    mode: 'script',
    inputDisplay: testCase.inputDisplay,
    expectedDisplay: testCase.expectedDisplay,
    actualDisplay: actualStdout,
    debugOutput: workerResult.debugOutput,
    passed,
    status: passed ? 'passed' : 'failed',
    durationMs: workerResult.durationMs,
  }
}

export type { ResolvedTestCase, RunOptions, RunSummary, TestResult }
