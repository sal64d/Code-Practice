---
title: Remove Element
difficulty: easy
tags: ["array", "two-pointer"]
supportedLanguages: ["javascript"]
runner:
  mode: function
  entrypoint: removeElement
signature:
  args:
    - name: nums
      type: int[]
    - name: val
      type: int
  returns: int
starterCode:
  javascript: |
    function removeElement(nums, val) {
      // Remove all occurrences of val from nums in-place.
      // Return the count of elements that are not equal to val.
    }
tests:
  visible:
    - name: sample 1
      input:
        nums: [3,2,2,3]
        val: 3
      expected: 2
      expectedArgs:
        nums:
          prefix: [2,2]
          compare: unordered-array
    - name: sample 2
      input:
        nums: [0,1,2,2,3,0,4,2]
        val: 2
      expected: 5
      expectedArgs:
        nums:
          prefix: [0,0,1,3,4]
          compare: unordered-array
    - name: no removals
      input:
        nums: [1,2,3,4]
        val: 5
      expected: 4
      expectedArgs:
        nums:
          prefix: [1,2,3,4]
          compare: unordered-array
    - name: all removed
      input:
        nums: [7,7,7]
        val: 7
      expected: 0
      expectedArgs:
        nums:
          prefix: []
          compare: unordered-array
---

## Problem Statement

Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` in-place. The order of the elements may be changed.

Return the number of elements in `nums` which are not equal to `val`.

Let `k` be the number of elements in `nums` which are not equal to `val`. To be accepted, your solution must:

- Change `nums` so that the first `k` elements contain the elements which are not equal to `val`.
- Return `k`.

The remaining elements of `nums` are not important.

### Custom Judge

The judge checks that your returned value is `k`, then sorts the first `k` elements of `nums` and compares them with the expected values. Because of this, the first `k` elements may be in any order.

### Examples

#### Example 1
- **Input:** `nums = [3,2,2,3]`, `val = 3`
- **Output:** `2, nums = [2,2,_,_]`
- **Explanation:** Your function should return `k = 2`, with the first two elements of `nums` being `2`.

#### Example 2
- **Input:** `nums = [0,1,2,2,3,0,4,2]`, `val = 2`
- **Output:** `5, nums = [0,1,4,0,3,_,_,_]`
- **Explanation:** Your function should return `k = 5`, with the first five elements containing `0`, `0`, `1`, `3`, and `4` in any order.
