# PRD: V1 Build Tickets

## Introduction

Break the logical programming learning app into story-sized implementation tickets. The repo now contains a base Vite React app in `app/ui`, architecture docs in `tasks/architecture`, and an example practice question in `practice_questions/001_array_two_sums.md`.

The first implementation milestone is an end-to-end thin slice: username login, Supabase setup, one seeded problem, JavaScript browser runner, and saved submission. After that, implementation expands into full problem versioning, PHP runner support, uploads, submissions browser, progress, realtime social features, Vercel deployment, and a Vercel Go function spike.

## Goals

- Implement the app in story-sized tickets that can be picked up independently.
- Prioritize an end-to-end thin slice before broad feature work.
- Use Supabase CLI migrations and generated TypeScript types.
- Use direct Supabase access from the Vite UI with `supabase-js`.
- Keep Vercel Go work as a spike unless the spike proves a concrete need.
- Make credential and environment setup explicit without putting secrets in source control.

## Credential And Environment Setup

For implementation, do not paste secrets into chat or commit them.

Expected local UI env file:

```txt
app/ui/.env.local
```

Expected browser-safe values:

```txt
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# or, if using newer Supabase key naming:
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Expected Supabase CLI setup:

```txt
supabase login
supabase link --project-ref <your-project-ref>
```

Expected Vercel setup:

- Vercel project root should point at `app/ui` for the Vite app.
- Add the same browser-safe Supabase env vars in Vercel project settings.
- If the Go spike uses server-only Supabase access, store `SUPABASE_SERVICE_ROLE_KEY` only as a server-side Vercel/local env var. Never prefix it with `VITE_`.

## User Stories / Tickets

### US-001: Add Supabase CLI Project Structure
**Description:** As a developer, I want Supabase migrations tracked in the repo so database changes are reproducible.

**Acceptance Criteria:**
- [ ] Add Supabase CLI project structure under `supabase/`.
- [ ] Document how to link the local repo to the existing Supabase project.
- [ ] Do not commit Supabase access tokens or project secrets.
- [ ] Typecheck/lint passes.

### US-002: Create Core Database Types And Tables
**Description:** As a developer, I want the core Supabase schema created so the app can store problems, attempts, submissions, progress, and activity.

**Acceptance Criteria:**
- [ ] Add migration for enum types: language, difficulty, problem source type, problem version status, activity event type.
- [ ] Add tables: `profiles`, `problems`, `problem_versions`, `attempts`, `submissions`, `problem_progress`, `language_progress`, `solved_versions`, `activity_events`.
- [ ] Add required primary keys, foreign keys, checks, and unique constraints from `tasks/architecture/db-plan.md`.
- [ ] Migration applies successfully against the linked Supabase project.
- [ ] Typecheck/lint passes.

### US-003: Create Storage Buckets And Policies
**Description:** As a developer, I want Supabase Storage configured so MDX and submitted code snapshots can be stored.

**Acceptance Criteria:**
- [ ] Add migration or documented setup for private buckets `problem-mdx` and `submission-code`.
- [ ] Authenticated users can read both buckets.
- [ ] Authenticated users can upload to both buckets.
- [ ] Buckets are not public.
- [ ] Service-role keys are not required by the Vite UI.
- [ ] Typecheck/lint passes.

### US-004: Enable Anonymous Auth And Prototype Policies
**Description:** As a developer, I want Supabase anonymous auth and prototype policies so the username gate can use authenticated Supabase access.

**Acceptance Criteria:**
- [ ] Document enabling Supabase anonymous sign-ins in the Supabase dashboard.
- [ ] Add table policies that allow authenticated prototype users to perform required v1 reads/writes.
- [ ] Unauthenticated users cannot access app data through normal authenticated table policies.
- [ ] Policies explicitly reflect weak prototype identity and do not claim strong privacy.
- [ ] Typecheck/lint passes.

### US-005: Add Supabase RPC Functions
**Description:** As a developer, I want compound writes handled by Supabase RPC so the browser does not perform fragile multi-table transactions.

**Acceptance Criteria:**
- [ ] Add `upsert_profile`.
- [ ] Add `publish_problem_version`.
- [ ] Add `commit_submission`.
- [ ] Add `pin_best_submission`.
- [ ] Add `switch_problem_version`.
- [ ] RPC functions validate required inputs and return useful errors.
- [ ] Migration applies successfully.
- [ ] Typecheck/lint passes.

### US-006: Generate Supabase TypeScript Types
**Description:** As a developer, I want generated database types so UI data modules can use typed Supabase calls.

**Acceptance Criteria:**
- [ ] Add a script or documented command to generate Supabase TypeScript types.
- [ ] Generated types are placed under `app/ui/src/types/` or another documented UI path.
- [ ] UI imports generated types without circular dependencies.
- [ ] Typecheck/lint passes.

### US-007: Add UI Dependencies And App Providers
**Description:** As a developer, I want the base Vite app wired with routing, query caching, and Supabase client support.

**Acceptance Criteria:**
- [ ] Install React Router, TanStack Query, Supabase client, and required utility libraries.
- [ ] Add app-level providers for routing, query client, and username session.
- [ ] Replace the default Vite starter screen with app routes.
- [ ] Existing Vite build still succeeds.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-008: Add Supabase Client And Env Validation
**Description:** As a developer, I want a typed Supabase client module so the UI can safely read required environment variables.

**Acceptance Criteria:**
- [ ] Add `app/ui/src/lib/supabase/client.ts`.
- [ ] Read only browser-safe env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Missing env vars show a clear development error.
- [ ] No service-role or database password env var is referenced in UI code.
- [ ] Typecheck/lint passes.

### US-009: Implement Username Login Gate
**Description:** As a learner, I want to enter a username before using the app so my work is attached to that username.

**Acceptance Criteria:**
- [ ] `/login` shows a username form.
- [ ] Username is normalized into `usernameKey`.
- [ ] App creates or reuses a Supabase anonymous auth session after username entry.
- [ ] App calls `upsert_profile`.
- [ ] Username session is stored in localStorage.
- [ ] All non-login routes redirect to `/login` until a username is set.
- [ ] Login screen includes compact copy that username identity is prototype-only.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-010: Seed One Official Problem
**Description:** As a learner, I want one official problem available so the thin slice can be exercised end to end.

**Acceptance Criteria:**
- [ ] Convert `practice_questions/001_array_two_sums.md` into the accepted MDX/frontmatter format with visible stdin/stdout tests.
- [ ] Add a seed script that uploads raw MDX to `problem-mdx` and inserts problem metadata/version rows.
- [ ] Seed script uses service-role credentials only outside the Vite browser app.
- [ ] Seeded problem appears as published in Supabase.
- [ ] Typecheck/lint passes.

### US-011: Build Problem List Page
**Description:** As a learner, I want to see available problems so I can choose one to solve.

**Acceptance Criteria:**
- [ ] `/problems` loads published problems from Supabase.
- [ ] Each problem shows title, difficulty, tags, supported languages, current version, and completion state.
- [ ] Empty state appears when no problems are seeded.
- [ ] Clicking a problem navigates to `/problems/:problemId`.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-012: Build Problem Detail Page For Seeded Problem
**Description:** As a learner, I want to read a problem and its visible tests so I know what to solve.

**Acceptance Criteria:**
- [ ] `/problems/:problemId` loads the default problem version.
- [ ] Page downloads and renders the MDX body.
- [ ] Page shows every visible test with stdin and expected stdout.
- [ ] Page shows language selector with JavaScript available.
- [ ] Page shows current problem version.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-013: Add CodeMirror Editor And Draft Autosave
**Description:** As a learner, I want an editor with autosave so I do not lose my solution draft.

**Acceptance Criteria:**
- [ ] Add CodeMirror 6 editor for JavaScript.
- [ ] Load starter code when no draft exists.
- [ ] Save immediately to localStorage using `usernameKey + problemVersionId + language`.
- [ ] Debounce remote draft save to `attempts.code_text`.
- [ ] Show save state: saving, saved, save failed.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-014: Implement JavaScript Worker Runner
**Description:** As a learner, I want to run JavaScript against visible tests in the browser so I get immediate feedback.

**Acceptance Criteria:**
- [ ] Runner executes each test in a fresh Web Worker.
- [ ] Worker exposes global `stdin`.
- [ ] Worker exposes `print(...)`.
- [ ] Worker captures `console.log(...)` as stdout.
- [ ] Runner enforces per-test timeout.
- [ ] Runner enforces output byte limit.
- [ ] Runner normalizes line endings and trims trailing whitespace before stdout comparison.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-015: Build Test Results Panel
**Description:** As a learner, I want clear test results so I can see what passed or failed.

**Acceptance Criteria:**
- [ ] Results panel shows passed/total summary.
- [ ] Each failed test shows stdin, expected stdout, actual stdout, and stderr when present.
- [ ] Runtime errors and timeouts are labeled separately.
- [ ] UI copy says local result or visible tests, not verified judging.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-016: Commit JavaScript Submission
**Description:** As a learner, I want my completed run saved so I can view my submission later.

**Acceptance Criteria:**
- [ ] UI generates a submission id before upload.
- [ ] UI uploads immutable source snapshot to `submission-code`.
- [ ] UI calls `commit_submission` with code path, code preview, result summary, and test details.
- [ ] Passing all visible tests marks the problem version solved.
- [ ] Submissions, progress, and activity queries refresh after commit.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-017: Thin Slice Browser Verification
**Description:** As a developer, I want the first milestone verified end to end so later work builds on a working path.

**Acceptance Criteria:**
- [ ] Start local Vite dev server.
- [ ] In browser, enter username.
- [ ] Open seeded Two Sum problem.
- [ ] Edit JavaScript code.
- [ ] Run visible tests and see pass/fail feedback.
- [ ] Save a submission.
- [ ] Refresh page and confirm draft/progress/submission state still loads.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-018: Add Problem Version Selection
**Description:** As a learner, I want problem versions to behave predictably when a problem changes.

**Acceptance Criteria:**
- [ ] New users open the latest published version by default.
- [ ] Existing users return to their started version.
- [ ] User can explicitly switch version.
- [ ] Version switch calls `switch_problem_version`.
- [ ] UI shows when solved previous version differs from latest unsolved version.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-019: Build Progress Page
**Description:** As a learner, I want to see attempted and solved problems so I can track my work.

**Acceptance Criteria:**
- [ ] `/progress` lists attempted problems.
- [ ] Progress shows overall status and language-specific status.
- [ ] Progress shows latest attempted version and pinned best when available.
- [ ] Each row links back to the relevant problem.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-020: Build Submission Browser
**Description:** As a learner, I want to view all submissions so I can learn from other users' code.

**Acceptance Criteria:**
- [ ] Add per-problem submissions tab.
- [ ] Add global `/submissions` route.
- [ ] List shows username, problem, version, language, pass count, timestamp, pinned state, and code preview.
- [ ] Detail view downloads full source from Storage.
- [ ] Submitted code is visible before solving.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-021: Add Pin Best Submission Flow
**Description:** As a learner, I want to manually pin my best submission so I control which result represents my work.

**Acceptance Criteria:**
- [ ] Submission detail includes Pin Best action.
- [ ] Action calls `pin_best_submission`.
- [ ] Previous pinned best for username/problem/language is unpinned.
- [ ] Progress and submission list update after pinning.
- [ ] Activity event is created.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-022: Add Activity Feed
**Description:** As a learner, I want to see recent activity so the app feels collaborative.

**Acceptance Criteria:**
- [ ] `/activity` loads recent `activity_events`.
- [ ] Feed shows started attempt, submitted attempt, solved problem, published problem, and pinned best events.
- [ ] Feed uses denormalized display fields when available.
- [ ] Feed clearly allows noisy prototype activity.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-023: Add Realtime Activity Updates
**Description:** As a learner, I want activity feed updates without reloading so I can see current work.

**Acceptance Criteria:**
- [ ] UI subscribes to Supabase Realtime changes on `activity_events` after login.
- [ ] New events appear in the feed without full page reload.
- [ ] Feed refetches after reconnect.
- [ ] Subscription is cleaned up on logout or app teardown.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-024: Add Currently Attempting Presence
**Description:** As a learner, I want to see who is currently attempting a problem so I know who else is active.

**Acceptance Criteria:**
- [ ] Problem page joins presence channel `problem:{problemId}:{problemVersionId}`.
- [ ] Presence payload includes usernameKey, display username, selected language, and joined timestamp.
- [ ] Language changes update presence payload.
- [ ] Leaving the problem page untracks presence.
- [ ] UI shows active users near problem metadata.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-025: Build MDX Upload And Draft Flow
**Description:** As a prototype user, I want to upload problem MDX so new problems can be added without a code deployment.

**Acceptance Criteria:**
- [ ] `/upload` accepts pasted MDX and file input.
- [ ] Browser parses frontmatter and validates required fields.
- [ ] Browser generates a problem version id before upload.
- [ ] Valid draft uploads raw MDX to `problem-mdx`.
- [ ] Parsed metadata is saved as draft problem version.
- [ ] Invalid MDX shows field-specific validation errors.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-026: Build Publish Problem Flow
**Description:** As a prototype user, I want to publish a validated problem so others can solve it.

**Acceptance Criteria:**
- [ ] Draft problem can be published from upload flow.
- [ ] Publish calls `publish_problem_version`.
- [ ] Published problem appears in problem list.
- [ ] Publishing creates activity event.
- [ ] Editing published problem creates a new version, not mutation of old version.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-027: Render Full MDX In Main React Tree
**Description:** As a learner, I want uploaded problem MDX rendered in the app so problem authors can use rich MDX content.

**Acceptance Criteria:**
- [ ] Problem detail renders uploaded MDX in the main React tree.
- [ ] MDX rendering uses an error boundary.
- [ ] Rendering path supports official and uploaded problems.
- [ ] UI includes compact prototype-risk copy on upload/publish flow.
- [ ] Bad MDX does not crash the entire app shell.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-028: Add PHP Runner Adapter Spike
**Description:** As a developer, I want to prove a browser PHP runtime can run stdin/stdout tests before building full PHP support.

**Acceptance Criteria:**
- [ ] Create `PhpRunnerAdapter` interface.
- [ ] Spike at least one maintained PHP WASM/browser runtime.
- [ ] Verify stdin input, stdout output, stderr/runtime error handling, timeout behavior, worker execution, and Vite bundling.
- [ ] Record chosen runtime or blocker in a short note under `tasks/`.
- [ ] Typecheck/lint passes.

### US-029: Implement PHP Runner
**Description:** As a PHP learner, I want to run PHP scripts against visible tests in the browser.

**Acceptance Criteria:**
- [ ] PHP language option appears when problem supports PHP.
- [ ] PHP starter code loads and autosaves.
- [ ] PHP runner provides stdin to PHP `STDIN`.
- [ ] PHP runner captures stdout and stderr.
- [ ] PHP runner applies same comparison rules as JavaScript.
- [ ] PHP submissions can be committed through existing submission flow.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-030: Add Language-Specific Progress
**Description:** As a learner, I want JavaScript and PHP progress tracked separately and overall so I can practice both languages.

**Acceptance Criteria:**
- [ ] Problem list shows overall problem completion state.
- [ ] Problem detail shows language-specific solved/attempted state.
- [ ] Solving JavaScript does not mark PHP solved, and vice versa.
- [ ] Overall problem solved state reflects at least one solved language.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-031: Add Responsive App Layout
**Description:** As a learner, I want the app to work well on desktop and mobile.

**Acceptance Criteria:**
- [ ] Desktop problem page uses split problem/editor layout.
- [ ] Mobile problem page uses tabs for Problem, Code, Results, and Submissions.
- [ ] Run controls remain easy to reach near the editor.
- [ ] Text does not overlap or overflow buttons/cards at common viewport sizes.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-032: Add Vercel Deployment Configuration
**Description:** As a developer, I want the Vite app deployable to Vercel with the correct project root and environment variables.

**Acceptance Criteria:**
- [ ] Document Vercel project root as `app/ui`.
- [ ] Document build command and output directory.
- [ ] Document required Vercel env vars.
- [ ] Production build succeeds locally.
- [ ] Deployment does not require service-role keys.
- [ ] Typecheck/lint passes.

### US-033: Add Vercel Go Function Spike
**Description:** As a developer, I want to spike Vercel Go functions now so we understand the deployment shape if backend escape hatches are needed.

**Acceptance Criteria:**
- [ ] Add minimal Go function or Go server spike compatible with Vercel.
- [ ] Function returns JSON health payload.
- [ ] Function does not become required by the UI application flow.
- [ ] No service-role key is exposed to browser code.
- [ ] Document local run/deploy steps and whether Vercel supports the desired layout cleanly.
- [ ] Typecheck/lint/build passes for affected app.

### US-034: Add Optional Signed Upload Go Spike
**Description:** As a developer, I want to evaluate whether Go signed upload URLs are useful so future storage hardening has a known path.

**Acceptance Criteria:**
- [ ] Spike endpoint accepts a constrained bucket/path request.
- [ ] Endpoint rejects unknown buckets and unsafe paths.
- [ ] Endpoint uses server-only Supabase credentials if needed.
- [ ] Endpoint is not wired into the main UI flow.
- [ ] Document whether direct Supabase Storage upload remains preferred.
- [ ] Typecheck/lint/build passes for affected app.

### US-035: Add End-To-End Smoke Test Checklist
**Description:** As a developer, I want a repeatable smoke checklist so each milestone can be verified consistently.

**Acceptance Criteria:**
- [ ] Add checklist for login, problem list, problem detail, JS run, submission save, progress, submissions browser, upload/publish, activity, presence, and PHP run.
- [ ] Checklist includes required local env vars and Supabase project prerequisites.
- [ ] Checklist includes Vercel preview deployment verification.
- [ ] Typecheck/lint passes.

## Functional Requirements

- FR-1: The system must use Supabase CLI migrations for schema changes.
- FR-2: The system must generate TypeScript types from Supabase schema.
- FR-3: The UI must use direct Supabase access through `supabase-js`.
- FR-4: The UI must require username login before accessing app routes.
- FR-5: The UI must create or reuse Supabase anonymous auth after username entry.
- FR-6: The system must seed at least one official problem before the thin slice is complete.
- FR-7: JavaScript runner must execute visible stdin/stdout tests in browser workers.
- FR-8: Submission commit must upload source to Storage and call Supabase RPC.
- FR-9: Draft autosave must store local backup immediately and remote draft in Postgres.
- FR-10: The system must support problem progress, submissions, activity feed, and presence.
- FR-11: Uploaded MDX must validate frontmatter before draft save and publish.
- FR-12: Published problem edits must create new versions.
- FR-13: PHP support must be preceded by a runtime spike.
- FR-14: Vercel deployment configuration must be documented.
- FR-15: Vercel Go function spike must not become a required v1 backend unless a later decision explicitly changes that.

## Non-Goals

- No password or OAuth auth.
- No trusted server-side judging.
- No hidden tests.
- No production-grade identity or privacy.
- No admin-only upload controls.
- No global leaderboard.
- No mandatory Go backend dependency for the thin slice.

## Design Considerations

- Keep the first implementation milestone small and end-to-end.
- Replace Vite starter UI with the actual app shell.
- Use compact operational UI, not a marketing landing page.
- Keep problem solving editor-first.
- Show prototype trust-boundary copy where it prevents misunderstanding.
- Verify UI stories in browser, especially editor, runner, responsive layout, upload, and realtime features.

## Technical Considerations

- The existing UI app is in `app/ui`.
- The current app uses React 19, Vite 8, TypeScript 6, Yarn, and React Compiler plugin wiring.
- The root repo currently has planning docs and practice questions but no Supabase project files yet.
- Supabase service-role credentials are only for CLI/seed/server-side tasks and must not be exposed in Vite.
- The first implementation should prefer a hosted Supabase project linked through CLI.
- Go spike can live outside the main UI flow and should not block the thin slice unless Vercel project layout requires early decisions.

## Success Metrics

- Thin slice can be completed in browser: login, open seeded problem, run JavaScript tests, save submission.
- Supabase migrations apply from a clean linked project.
- Generated Supabase TypeScript types are usable in the UI.
- Vite build and lint pass after each ticket.
- Vercel preview deployment can load the app with configured Supabase env vars.
- Go function spike documents whether Go is practical for future backend escape hatches.

## Open Questions

- Which Supabase key name will the project use in UI env: `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, or both?
- Will the first seed script run from local developer machine, Vercel build, or a separate script command?
- Which PHP WASM runtime will pass the spike requirements?
- Should the signed upload Go spike use Supabase service-role credentials or remain a health-only exploration first?
