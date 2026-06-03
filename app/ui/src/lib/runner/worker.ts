// JavaScript Web Worker Runner
self.onmessage = function (e) {
  const { code, stdin } = e.data

  let stdoutBytes = 0
  const stdout: string[] = []
  const MAX_STDOUT = 1024 * 512 // 512 KB

  const printFn = (msg: any) => {
    const line = String(msg) + '\n'
    stdoutBytes += new Blob([line]).size
    if (stdoutBytes > MAX_STDOUT) {
      throw new Error('Stdout limit exceeded')
    }
    stdout.push(line)
  }

  const env = {
    stdin: String(stdin),
    print: printFn,
    console: {
      log: (...args: any[]) => {
        const line = args.map(String).join(' ') + '\n'
        stdoutBytes += new Blob([line]).size
        if (stdoutBytes > MAX_STDOUT) {
          throw new Error('Stdout limit exceeded')
        }
        stdout.push(line)
      },
    },
  }

  try {
    // We execute the code in an isolated scope with our mocked globals
    const fn = new Function('stdin', 'print', 'console', code)
    const start = performance.now()
    fn(env.stdin, env.print, env.console)
    const end = performance.now()

    self.postMessage({
      type: 'success',
      stdout: stdout.join(''),
      durationMs: Math.round(end - start),
      stdoutBytes,
    })
  } catch (error: any) {
    self.postMessage({
      type: 'error',
      stdout: stdout.join(''),
      stderr: error.stack || String(error),
      durationMs: 0,
      stdoutBytes,
    })
  }
}
