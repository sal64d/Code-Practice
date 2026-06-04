# Task: Function Runner Mode (LeetCode-style)

## Status
**Completed** — US-036 through US-039.

## Problem
Script-style `stdin`/`stdout` forces learners to parse raw text before solving. Array/function problems like Two Sum need typed parameters (`nums`, `target`) and return-value judging, with `console.log` for debugging only.

## Decision defaults (accepted)
1. **Default for new official problems:** `function` mode.
2. **Test authoring:** structured `input`/`expected` **and** `stdin` shorthand auto-parsed via `signature`.
3. **Return comparison:** `compareReturns: unordered-array` at problem level when order does not matter (Two Sum indices); per-test `compare` overrides allowed.

## Schema extension

```yaml
runner:
  mode: function
  entrypoint: twoSum
  compareReturns: unordered-array

signature:
  args:
    - { name: nums, type: int[] }
    - { name: target, type: int }
  returns: int[]

starterCode:
  javascript: |
    function twoSum(nums, target) {
      // nums: number[], target: number → number[]
    }

tests:
  visible:
    - name: sample 1
      input:
        nums: [2, 7, 11, 15]
        target: 9
      expected: [0, 1]
    - stdin: |
        [3, 2, 4]
        6
      expected: [1, 2]
```

## Implementation tickets

### US-036: Contract + parsers ✅
- `types.ts`, `inputParser.ts`, `outputCompare.ts`, `normalizeTests.ts`, `parseFrontmatter.ts`
- Updated `tasks/architecture/shared-interfaces.md`

### US-037: Function-mode worker ✅
- Extended `worker.ts` and `useRunner.ts`

### US-038: Two Sum migration ✅
- Updated `practice_questions/001_array_two_sums.md`
- Updated `seed.ts` with YAML frontmatter parser
- `ProblemDetailPage` loads `starterCode` from frontmatter

### US-039: Results UI ✅
- `TestResultsPanel`: return value + debug output + prototype copy
- Visible tests preview on problem detail page

## Re-seed note
Re-running `npx tsx scripts/seed.ts` is idempotent: it updates official version 1 in place when it already exists (same `problem_id` + `version_number`), then refreshes `parsed_frontmatter` and the MDX storage path.
