export type RunnerMode = 'script' | 'function'

export type ArgType = 'int' | 'float' | 'string' | 'bool' | 'int[]' | 'json'

export type CompareMode = 'strict' | 'exact' | 'unordered-array'

export interface SignatureArg {
  name: string
  type: ArgType
}

export interface ProblemSignature {
  args: SignatureArg[]
  returns: string
}

export interface RunnerConfig {
  mode: RunnerMode
  entrypoint?: string
  compareReturns?: CompareMode
}

export interface RawVisibleTestCase {
  name?: string
  stdin?: string
  stdout?: string
  expectedStdout?: string
  input?: Record<string, unknown>
  expected?: unknown
  expectedArgs?: Record<string, RawExpectedArgAssertion>
  compare?: CompareMode
}

export interface RawExpectedArgAssertion {
  exact?: unknown
  prefix?: unknown[]
  compare?: CompareMode
}

export interface ExpectedArgAssertion {
  name: string
  index: number
  kind: 'exact' | 'prefix'
  expected: unknown
  compare: CompareMode
}

export interface ProblemRunnerFrontmatter {
  runner?: RunnerConfig
  signature?: ProblemSignature
  starterCode?: Record<string, string>
  tests?: RawVisibleTestCase[] | { visible?: RawVisibleTestCase[] }
  compareReturns?: CompareMode
}

export interface ResolvedTestCase {
  name?: string
  mode: RunnerMode
  /** Script mode */
  stdin?: string
  expectedStdout?: string
  /** Function mode */
  args?: unknown[]
  argLabels?: string[]
  expectsReturn?: boolean
  expected?: unknown
  expectedArgs?: ExpectedArgAssertion[]
  compare: CompareMode
  /** Display string for UI */
  inputDisplay: string
  expectedDisplay: string
}

export interface WorkerRequest {
  mode: RunnerMode
  code: string
  stdin?: string
  entrypoint?: string
  args?: unknown[]
}

export interface WorkerResponse {
  type: 'success' | 'error'
  stdout?: string
  returnValue?: unknown
  args?: unknown[]
  debugOutput?: string
  stderr?: string
  durationMs: number
  stdoutBytes: number
}

export interface TestResult {
  index: number
  name?: string
  mode: RunnerMode
  inputDisplay: string
  expectedDisplay: string
  actualDisplay: string
  debugOutput?: string
  stderr?: string
  passed: boolean
  durationMs: number
  status: 'passed' | 'failed' | 'runtime_error' | 'timeout'
}

export interface RunSummary {
  mode: RunnerMode
  passed: number
  total: number
  durationMs: number
  stdoutBytes: number
  results: TestResult[]
}

export interface RunOptions {
  runner: RunnerConfig
  signature?: ProblemSignature
  tests: ResolvedTestCase[]
  limits?: { timeMs?: number; outputBytes?: number }
}
