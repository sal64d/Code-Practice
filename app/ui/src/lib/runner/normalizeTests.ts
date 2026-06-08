import {
  formatExpectedDisplay,
  formatInputDisplay,
  inputRecordToArgs,
  isValidEntrypoint,
  parseStdinToInput,
} from './inputParser.ts'
import type {
  CompareMode,
  ExpectedArgAssertion,
  ProblemRunnerFrontmatter,
  ProblemSignature,
  RawExpectedArgAssertion,
  RawVisibleTestCase,
  ResolvedTestCase,
  RunnerConfig,
} from './types.ts'

export function getVisibleTests(frontmatter: ProblemRunnerFrontmatter): RawVisibleTestCase[] {
  if (!frontmatter.tests) return []
  if (Array.isArray(frontmatter.tests)) return frontmatter.tests
  return frontmatter.tests.visible ?? []
}

export function resolveRunnerConfig(frontmatter: ProblemRunnerFrontmatter): RunnerConfig {
  return {
    mode: frontmatter.runner?.mode ?? 'script',
    entrypoint: frontmatter.runner?.entrypoint,
    compareReturns: frontmatter.runner?.compareReturns ?? frontmatter.compareReturns ?? 'strict',
  }
}

export function normalizeTests(
  frontmatter: ProblemRunnerFrontmatter,
): ResolvedTestCase[] {
  const runner = resolveRunnerConfig(frontmatter)
  const signature = frontmatter.signature
  const rawTests = getVisibleTests(frontmatter)

  if (runner.mode === 'function') {
    if (!runner.entrypoint || !isValidEntrypoint(runner.entrypoint)) {
      throw new Error('Function mode requires a valid entrypoint identifier')
    }
    if (!signature?.args?.length) {
      throw new Error('Function mode requires signature.args')
    }
  }

  return rawTests.map((test, index) => normalizeOneTest(test, runner, signature, index))
}

function normalizeOneTest(
  test: RawVisibleTestCase,
  runner: RunnerConfig,
  signature: ProblemSignature | undefined,
  index: number,
): ResolvedTestCase {
  const compare = test.compare ?? runner.compareReturns ?? 'strict'

  if (runner.mode === 'function' && signature) {
    const expectsReturn = Object.prototype.hasOwnProperty.call(test, 'expected')
    const expectedArgs = normalizeExpectedArgs(test.expectedArgs, signature)
    const inputRecord =
      test.input ??
      (test.stdin !== undefined ? parseStdinToInput(test.stdin, signature) : undefined)

    if (!inputRecord) {
      throw new Error(`Test ${index + 1} requires input or stdin`)
    }
    if (!expectsReturn && expectedArgs.length === 0) {
      throw new Error(`Test ${index + 1} requires expected return value or expectedArgs`)
    }

    const { args, labels } = inputRecordToArgs(inputRecord, signature)
    return {
      name: test.name,
      mode: 'function',
      args,
      argLabels: labels,
      expectsReturn,
      expected: test.expected,
      expectedArgs,
      compare,
      inputDisplay: formatInputDisplay(labels),
      expectedDisplay: formatFunctionExpectedDisplay(test, expectsReturn, expectedArgs),
    }
  }

  const stdin = test.stdin ?? ''
  const expectedStdout = test.stdout ?? test.expectedStdout ?? ''
  return {
    name: test.name,
    mode: 'script',
    stdin,
    expectedStdout,
    compare,
    inputDisplay: stdin,
    expectedDisplay: expectedStdout,
  }
}

function normalizeExpectedArgs(
  expectedArgs: Record<string, RawExpectedArgAssertion> | undefined,
  signature: ProblemSignature,
): ExpectedArgAssertion[] {
  if (!expectedArgs) return []

  return Object.entries(expectedArgs).map(([name, assertion]) => {
    const index = signature.args.findIndex((arg) => arg.name === name)
    if (index === -1) {
      throw new Error(`expectedArgs references unknown argument "${name}"`)
    }

    const hasExact = Object.prototype.hasOwnProperty.call(assertion, 'exact')
    const hasPrefix = Object.prototype.hasOwnProperty.call(assertion, 'prefix')
    if (hasExact === hasPrefix) {
      throw new Error(`expectedArgs.${name} must provide exactly one of exact or prefix`)
    }

    if (hasPrefix && !Array.isArray(assertion.prefix)) {
      throw new Error(`expectedArgs.${name}.prefix must be an array`)
    }

    return {
      name,
      index,
      kind: hasPrefix ? 'prefix' : 'exact',
      expected: hasPrefix ? assertion.prefix : assertion.exact,
      compare: normalizeCompare(assertion.compare, 'strict'),
    }
  })
}

function normalizeCompare(compare: CompareMode | undefined, fallback: CompareMode): CompareMode {
  if (compare === undefined) return fallback
  if (compare === 'strict' || compare === 'exact' || compare === 'unordered-array') return compare
  throw new Error(`Unsupported compare mode: ${String(compare)}`)
}

function formatFunctionExpectedDisplay(
  test: RawVisibleTestCase,
  expectsReturn: boolean,
  expectedArgs: ExpectedArgAssertion[],
): string {
  const lines: string[] = []
  if (expectsReturn) {
    lines.push(`return = ${formatExpectedDisplay(test.expected)}`)
  }
  for (const assertion of expectedArgs) {
    const label = assertion.kind === 'prefix' ? `${assertion.name} prefix` : assertion.name
    lines.push(`${label} = ${formatExpectedDisplay(assertion.expected)}`)
  }
  return lines.join('\n')
}

export function getStarterCode(
  frontmatter: ProblemRunnerFrontmatter,
  language: 'javascript' | 'php',
): string | undefined {
  return frontmatter.starterCode?.[language]
}
