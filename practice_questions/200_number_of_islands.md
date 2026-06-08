---
title: Number of Islands
difficulty: medium
tags: ["array", "depth_first_search", "breadth_first_search", "union_find", "matrix"]
supportedLanguages: ["javascript"]
runner:
  mode: function
  entrypoint: numIslands
signature:
  args:
    - name: grid
      type: json
  returns: int
starterCode:
  javascript: |
    function numIslands(grid) {
      // grid is a string[][] containing "1" for land and "0" for water.
      // Return the number of islands.
    }
tests:
  visible:
    - name: sample 1
      input:
        grid:
          - ["1","1","1","1","0"]
          - ["1","1","0","1","0"]
          - ["1","1","0","0","0"]
          - ["0","0","0","0","0"]
      expected: 1
    - name: sample 2
      input:
        grid:
          - ["1","1","0","0","0"]
          - ["1","1","0","0","0"]
          - ["0","0","1","0","0"]
          - ["0","0","0","1","1"]
      expected: 3
    - name: single land
      input:
        grid:
          - ["1"]
      expected: 1
    - name: all water
      input:
        grid:
          - ["0","0"]
          - ["0","0"]
      expected: 0
    - name: diagonal land is separate
      input:
        grid:
          - ["1","0","1"]
          - ["0","1","0"]
          - ["1","0","1"]
      expected: 5
---

## Problem Statement

Given an `m x n` 2D binary grid `grid` which represents a map of `"1"`s (land) and `"0"`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.

### Examples

#### Example 1
- **Input:** `grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]`
- **Output:** `1`

#### Example 2
- **Input:** `grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]`
- **Output:** `3`
