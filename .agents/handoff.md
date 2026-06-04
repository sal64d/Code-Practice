# Agent Handoff Document

This file is used to share context, progress, issues, and mistakes between different agent threads working on the project.

## Agent Protocols
**CRITICAL REQUIREMENTS FOR ALL AGENTS:**
1. **Handoff File Updates:** You MUST update this `handoff.md` file *before* starting your task and *after* completing your task to ensure continuity.
2. **Task Log File:** You MUST maintain a real-time task log file (e.g., `task.md` in the agent's artifacts directory or `.agents/task-log.md`) where you document everything you are doing *while* you are doing it. This ensures that if the agent session cuts off midway due to token limits, the next agent can seamlessly resume the work.

## Task Progress
- **Completed**: Design system + Storybook (MUI split).
- **Completed**: Function runner mode (US-036–US-039). See `tasks/function-runner-mode.md`.

## Current Goal
Resume thin-slice work: US-013 remote draft autosave, US-017 browser verification, or US-018+ post-thin-slice features.

## Issues Faced
- Seed script failed on re-run with `problem_versions_unique_number` — fixed by updating version 1 in place.
- Problem page rendered raw YAML frontmatter as markdown; stale localStorage draft hid function-mode starter code — fixed by stripping frontmatter for display and including `content_hash` in draft key.

## Mistakes Made & Lessons Learned
- Script-mode stdin was a poor fit for array/function problems; function mode with `signature` + structured tests is the default for official problems going forward.

## Requested Changes
- User requested to use MUI instead of shadcn/ui.
- CodeMirror stays in the application logic layer, design system only provides `EditorContainer`.
- Function runner mode implemented per `tasks/function-runner-mode.md`.
