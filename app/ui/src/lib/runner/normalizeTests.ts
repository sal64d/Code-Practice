import {
  formatExpectedDisplay,
  formatInputDisplay,
  inputRecordToArgs,
  isValidEntrypoint,
  parseStdinToInput,
} from './inputParser.ts'
import type {
  ProblemRunnerFrontmatter,
  ProblemSignature,
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
    const inputRecord =
      test.input ??
      (test.stdin !== undefined ? parseStdinToInput(test.stdin, signature) : undefined)

    if (!inputRecord) {
      throw new Error(`Test ${index + 1} requires input or stdin`)
    }
    if (test.expected === undefined) {
      throw new Error(`Test ${index + 1} requires expected return value`)
    }

    const { args, labels } = inputRecordToArgs(inputRecord, signature)
    return {
      name: test.name,
      mode: 'function',
      args,
      argLabels: labels,
      expected: test.expected,
      compare,
      inputDisplay: formatInputDisplay(labels),
      expectedDisplay: formatExpectedDisplay(test.expected),
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

export function getStarterCode(
  frontmatter: ProblemRunnerFrontmatter,
  language: 'javascript' | 'php',
): string | undefined {
  return frontmatter.starterCode?.[language]
}
