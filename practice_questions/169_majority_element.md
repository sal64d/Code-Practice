---
title: Majority Element
difficulty: easy
tags: ["array", "hash_table", "divide_and_conquer", "sorting", "counting"]
supportedLanguages: ["javascript"]
runner:
  mode: function
  entrypoint: majorityElement
signature:
  args:
    - name: nums
      type: int[]
  returns: int
starterCode:
  javascript: |
    function majorityElement(nums) {
      // Return the element that appears more than Math.floor(nums.length / 2) times.
    }
tests:
  visible:
    - name: sample 1
      input:
        nums: [3,2,3]
      expected: 3
    - name: sample 2
      input:
        nums: [2,2,1,1,1,2,2]
      expected: 2
    - name: single element
      input:
        nums: [1]
      expected: 1
    - name: negative majority
      input:
        nums: [-1,-1,-1,2,3]
      expected: -1
---

## Problem Statement

Given an array `nums` of size `n`, return the majority element.

The majority element is the element that appears more than `floor(n / 2)` times. You may assume that the majority element always exists in the array.

### Examples

#### Example 1
- **Input:** `nums = [3,2,3]`
- **Output:** `3`

#### Example 2
- **Input:** `nums = [2,2,1,1,1,2,2]`
- **Output:** `2`
