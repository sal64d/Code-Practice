import type { CompareMode } from './types.ts'

export function serializeValue(value: unknown): string {
  return JSON.stringify(value) ?? 'undefined'
}

export function valuesMatch(actual: unknown, expected: unknown, compare: CompareMode): boolean {
  if (compare === 'unordered-array') {
    return compareUnorderedArray(actual, expected)
  }
  return deepEqual(actual, expected)
}

function compareUnorderedArray(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false
    if (actual.every((item) => typeof item === 'number') && expected.every((item) => typeof item === 'number')) {
      const sortedActual = [...actual].sort((a, b) => a - b)
      const sortedExpected = [...expected].sort((a, b) => a - b)
      return sortedActual.every((value, index) => value === sortedExpected[index])
    }
    return deepEqual(actual, expected)
  }
  return deepEqual(actual, expected)
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  return false
}
