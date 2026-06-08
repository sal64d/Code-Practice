---
title: Merge Sorted Array
difficulty: easy
tags: ["array", "two-pointer", "sorting"]
supportedLanguages: ["javascript"]
runner:
  mode: function
  entrypoint: mergeSortedArray
signature:
  args:
    - name: nums1
      type: int[]
    - name: m
      type: int
    - name: nums2
      type: int[]
    - name: n
      type: int
  returns: void
starterCode:
  javascript: |
    function mergeSortedArray(nums1, m, nums2, n) {
      // nums1 has length m + n, with the first m elements valid and the last n elements set to 0.
      // Merge nums2 into nums1 in-place, resulting in a sorted array.
      // TODO: implement the merge algorithm.
    }
tests:
  visible:
    - name: sample 1
      input:
        nums1: [1,2,3,0,0,0]
        m: 3
        nums2: [2,5,6]
        n: 3
      expectedArgs:
        nums1:
          exact: [1,2,2,3,5,6]
    - name: sample 2
      input:
        nums1: [1]
        m: 1
        nums2: []
        n: 0
      expectedArgs:
        nums1:
          exact: [1]
    - name: sample 3
      input:
        nums1: [0]
        m: 0
        nums2: [1]
        n: 1
      expectedArgs:
        nums1:
          exact: [1]
---

## Problem Statement

You are given two integer arrays **nums1** and **nums2**, both sorted in non‑decreasing order, and two integers **m** and **n** representing the number of initialized elements in each array.

- `nums1` has a length of `m + n`. The first `m` elements contain valid data, and the last `n` elements are set to `0` and should be ignored.
- `nums2` has a length of `n`.

Merge `nums2` into `nums1` so that `nums1` becomes a single sorted array in non‑decreasing order.

The function **must not** return a new array; instead, it should modify `nums1` in‑place.

### Examples

#### Example 1
- **Input:** `nums1 = [1,2,3,0,0,0]`, `m = 3`, `nums2 = [2,5,6]`, `n = 3`
- **Output:** `[1,2,2,3,5,6]`
- **Explanation:** The arrays to merge are `[1,2,3]` and `[2,5,6]`.

#### Example 2
- **Input:** `nums1 = [1]`, `m = 1`, `nums2 = []`, `n = 0`
- **Output:** `[1]`

#### Example 3
- **Input:** `nums1 = [0]`, `m = 0`, `nums2 = [1]`, `n = 1`
- **Output:** `[1]`
- **Explanation:** `m = 0` means no initial elements in `nums1`; the leading `0` is only a placeholder to accommodate the merged result.
