import type { WorkerRequest, WorkerResponse } from './types.ts'

const MAX_DEBUG_BYTES = 1024 * 512

self.onmessage = function (e: MessageEvent<WorkerRequest>) {
  const request = e.data

  if (request.mode === 'function') {
    runFunctionMode(request)
    return
  }

  runScriptMode(request)
}

function runScriptMode(request: WorkerRequest) {
  const { code, stdin = '' } = request

  let stdoutBytes = 0
  const stdout: string[] = []

  const printFn = (msg: unknown) => {
    appendStdout(String(msg), stdout, () => {
      stdoutBytes += new Blob([String(msg) + '\n']).size
    })
  }

  const envConsole = createConsole((line) => {
    stdoutBytes += new Blob([line]).size
    if (stdoutBytes > MAX_DEBUG_BYTES) {
      throw new Error('Stdout limit exceeded')
    }
    stdout.push(line)
  })

  try {
    const fn = new Function('stdin', 'print', 'console', code)
    const start = performance.now()
    fn(String(stdin), printFn, envConsole)
    const end = performance.now()

    postResult({
      type: 'success',
      stdout: stdout.join(''),
      durationMs: Math.round(end - start),
      stdoutBytes,
    })
  } catch (error: unknown) {
    postResult({
      type: 'error',
      stdout: stdout.join(''),
      stderr: formatError(error),
      durationMs: 0,
      stdoutBytes,
    })
  }
}

function runFunctionMode(request: WorkerRequest) {
  const { code, entrypoint, args = [] } = request
  const debugLines: string[] = []
  let debugBytes = 0

  const envConsole = createConsole((line) => {
    debugBytes += new Blob([line]).size
    if (debugBytes > MAX_DEBUG_BYTES) {
      throw new Error('Debug output limit exceeded')
    }
    debugLines.push(line.trimEnd())
  })

  try {
    if (!entrypoint) {
      throw new Error('Function mode requires an entrypoint')
    }

    const fn = new Function(
      'console',
      `
      ${code}
      const __entry = ${entrypoint};
      if (typeof __entry !== 'function') {
        throw new Error('Entrypoint "${entrypoint}" is not a function');
      }
      return __entry;
    `,
    )(envConsole) as (...fnArgs: unknown[]) => unknown

    const start = performance.now()
    const returnValue = fn(...args)
    const end = performance.now()

    postResult({
      type: 'success',
      returnValue,
      debugOutput: debugLines.join('\n'),
      durationMs: Math.round(end - start),
      stdoutBytes: debugBytes,
    })
  } catch (error: unknown) {
    postResult({
      type: 'error',
      debugOutput: debugLines.join('\n'),
      stderr: formatError(error),
      durationMs: 0,
      stdoutBytes: debugBytes,
    })
  }
}

function createConsole(onLine: (line: string) => void) {
  return {
    log: (...logArgs: unknown[]) => {
      onLine(logArgs.map(String).join(' ') + '\n')
    },
  }
}

function appendStdout(line: string, stdout: string[], onBytes: () => void) {
  onBytes()
  if (stdout.join('').length > MAX_DEBUG_BYTES) {
    throw new Error('Stdout limit exceeded')
  }
  stdout.push(line + '\n')
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message
  }
  return String(error)
}

function postResult(response: WorkerResponse) {
  self.postMessage(response)
}
