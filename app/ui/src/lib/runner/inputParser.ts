import type { ArgType, ProblemSignature, SignatureArg } from './types.ts'

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export function isValidEntrypoint(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name)
}

export function parseArgValue(raw: string, type: ArgType): unknown {
  const trimmed = raw.trim()
  switch (type) {
    case 'int': {
      const value = Number(trimmed)
      if (!Number.isInteger(value)) {
        throw new Error(`Expected integer, got "${trimmed}"`)
      }
      return value
    }
    case 'float': {
      const value = Number(trimmed)
      if (Number.isNaN(value)) {
        throw new Error(`Expected number, got "${trimmed}"`)
      }
      return value
    }
    case 'string':
      return trimmed
    case 'bool': {
      if (trimmed === 'true') return true
      if (trimmed === 'false') return false
      throw new Error(`Expected boolean, got "${trimmed}"`)
    }
    case 'int[]': {
      const parsed = JSON.parse(trimmed) as unknown
      if (!Array.isArray(parsed) || !parsed.every((n) => Number.isInteger(n))) {
        throw new Error(`Expected int array JSON, got "${trimmed}"`)
      }
      return parsed
    }
    case 'json':
      return JSON.parse(trimmed)
    default:
      throw new Error(`Unsupported arg type: ${type satisfies never}`)
  }
}

export function parseStdinToInput(stdin: string, signature: ProblemSignature): Record<string, unknown> {
  const lines = stdin
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

  if (lines.length < signature.args.length) {
    throw new Error(
      `stdin has ${lines.length} value line(s) but signature expects ${signature.args.length} argument(s)`,
    )
  }

  const input: Record<string, unknown> = {}
  for (let i = 0; i < signature.args.length; i++) {
    const arg = signature.args[i]
    input[arg.name] = parseArgValue(lines[i], arg.type)
  }
  return input
}

export function inputRecordToArgs(
  input: Record<string, unknown>,
  signature: ProblemSignature,
): { args: unknown[]; labels: string[] } {
  const args: unknown[] = []
  const labels: string[] = []

  for (const arg of signature.args) {
    if (!(arg.name in input)) {
      throw new Error(`Missing input field "${arg.name}"`)
    }
    const value = input[arg.name]
    validateArgValue(value, arg)
    args.push(value)
    labels.push(formatArgLabel(arg.name, value))
  }

  return { args, labels }
}

function validateArgValue(value: unknown, arg: SignatureArg): void {
  switch (arg.type) {
    case 'int':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error(`"${arg.name}" must be an integer`)
      }
      break
    case 'float':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(`"${arg.name}" must be a number`)
      }
      break
    case 'string':
      if (typeof value !== 'string') {
        throw new Error(`"${arg.name}" must be a string`)
      }
      break
    case 'bool':
      if (typeof value !== 'boolean') {
        throw new Error(`"${arg.name}" must be a boolean`)
      }
      break
    case 'int[]':
      if (!Array.isArray(value) || !value.every((n) => Number.isInteger(n))) {
        throw new Error(`"${arg.name}" must be an array of integers`)
      }
      break
    case 'json':
      break
  }
}

export function formatArgLabel(name: string, value: unknown): string {
  return `${name} = ${JSON.stringify(value)}`
}

export function formatInputDisplay(labels: string[]): string {
  return labels.join('\n')
}

export function formatExpectedDisplay(expected: unknown): string {
  return JSON.stringify(expected)
}
