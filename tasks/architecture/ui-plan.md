# Vite UI Design

Status: accepted v1 design.

This plan uses the recommended answers from `ui-open-questions.md`, except for the explicit decisions already written there:

- Use Yarn create Vite with React + TypeScript and React Compiler support.
- Render uploaded full MDX in the main React tree instead of an iframe.

## Purpose

The UI is the primary application surface. It runs on Vercel as a Vite app and talks directly to Supabase for database, Storage, Realtime, Presence, and anonymous auth. Code execution happens in the browser.

The UI must keep the app editor-first while making submissions, uploads, activity, and collaboration visible.

## Stack

- Build tool: Vite.
- Package manager: Yarn.
- Framework: React + TypeScript.
- Routing: React Router.
- React optimization: React Compiler when compatible with the selected React version and tooling.
- Server state: TanStack Query.
- Local app identity: React context for username session.
- Editor: CodeMirror 6.
- Supabase access: `supabase-js`.
- MDX parsing/validation/rendering: shared TypeScript schema plus MDX renderer/compiler.

## Environment Variables

Allowed in browser:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY
VITE_FEATURE_*
```

Use either Supabase's newer publishable key or the existing anon key depending on the project setup.

Never expose:

```txt
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD
```

## App Routes

```txt
/login
/problems
/problems/:problemId
/problems/:problemId?version=:problemVersionId
/submissions
/progress
/activity
/upload
```

Routing rules:

- Every route except `/login` requires a username session.
- After login, navigate to `/problems`.
- Unknown routes redirect to `/problems` after login or `/login` before login.
- Problem version URL param is used only for explicit version selection.

## Session Flow

1. User enters display username.
2. UI normalizes it to `usernameKey`.
3. UI stores `displayUsername` and `usernameKey` in localStorage.
4. UI calls Supabase anonymous sign-in if there is no active Supabase session.
5. UI calls `upsert_profile(username_key, display_username)`.
6. TanStack Query caches are enabled after the session is ready.

Switch user:

- Clear username context and localStorage identity.
- Keep or sign out the Supabase anonymous session; either is acceptable because `usernameKey` is the product identity.
- Clear TanStack Query cache.
- Return to `/login`.

Trust-boundary copy:

- Login should say that usernames are prototype identities and can be reused by anyone with the URL.
- Submission browser should say submitted code is visible to logged-in users.
- Upload/publish should say full MDX is trusted internal prototype content.

## Supabase Client Layer

Use `supabase-js` directly, but keep calls behind small modules:

```txt
src/lib/supabase/client.ts
src/lib/api/profiles.ts
src/lib/api/problems.ts
src/lib/api/attempts.ts
src/lib/api/submissions.ts
src/lib/api/progress.ts
src/lib/api/activity.ts
src/lib/api/storage.ts
```

Rules:

- Components do not call Supabase directly except simple subscription setup hooks.
- Data modules expose typed functions.
- TanStack Query hooks wrap data modules.
- Mutations invalidate only the affected query keys.

## Query And Cache Model

Use TanStack Query for:

- Profile.
- Problem list.
- Problem detail/version metadata.
- Progress.
- Attempts.
- Submissions.
- Activity feed history.

Use local React state for:

- Editor text before debounce.
- Current run state.
- Per-test in-progress status.
- MDX upload form state.

Use localStorage for:

- Username session.
- Immediate draft recovery per `usernameKey + problemVersionId + language`.

Add Zustand only if cross-route UI state becomes awkward during implementation.

## Problem Catalog

The UI reads one normalized catalog from Supabase:

- Official repo-backed problems are seeded into Supabase.
- Uploaded problems are stored in the same `problems` and `problem_versions` model.
- Problem list joins current published version metadata and user progress.

Problem list features:

- Filter by difficulty and tag.
- Sort by newest, difficulty, and completion status.
- Show title, difficulty, tags, languages, current version, and completion state.

Completion labels:

- Unattempted.
- Attempted.
- Solved current version.
- Solved previous version, latest unsolved.

## Problem Version Selection

Default version rules:

- New username/problem pair opens latest published version.
- Existing progress opens `startedProblemVersionId`.
- Explicit version switch uses `?version=...` and calls `switch_problem_version`.

UI requirements:

- Show current version number.
- Show when a newer version exists.
- Explain that switching versions can change tests, starter code, and solved status.
- Never erase older solved status.

## Problem Page Layout

Desktop:

- Two-pane split.
- Left pane: problem statement, metadata, visible tests, version controls, presence.
- Right pane: language selector, editor, run controls, results.
- Secondary tabs or drawer: submissions and activity for the problem.

Mobile:

- Tabs: Problem, Code, Results, Submissions.
- Run controls remain sticky near the editor.
- Test result summary remains reachable without long scrolling.

Design constraints:

- Editor-first, not submission-gallery-first.
- Dense, functional UI.
- Use compact badges for difficulty, tags, language, version, and solved status.

## MDX Upload, Validation, And Rendering

Upload flow:

1. User opens `/upload`.
2. User pastes MDX or selects an MDX file.
3. Browser parses frontmatter and validates schema.
4. Valid draft can be uploaded to `problem-mdx`.
5. Parsed metadata is written to `problem_versions` as `draft`.
6. Publish calls `publish_problem_version`.
7. Publish inserts activity event through the RPC.

Validation timing:

- Validate before saving draft.
- Validate again before publish.

Rendering decision:

- Uploaded full MDX renders in the main React tree.
- This follows the explicit override in `ui-open-questions.md`.
- Do not expose Supabase service-role keys or privileged app internals to MDX components.
- Wrap MDX rendering in an error boundary so a bad problem does not crash the whole app.
- Use a constrained component registry where practical, even though full MDX is allowed.
- Document that this is internal-prototype-only and unsafe for untrusted publishing.

Official and uploaded MDX should use the same rendering path unless implementation friction is high.

## Editor

Use CodeMirror 6.

Modes:

- JavaScript.
- PHP-like syntax highlighting.

Behavior:

- Language switch loads remote attempt if present.
- If no remote attempt exists, load starter code.
- Local draft saves immediately to localStorage.
- Remote draft save debounces into Postgres `attempts.code_text`.
- Show save state: saving, saved, save failed.
- Conflict policy: last write wins.

Recommended local draft key:

```txt
draft:{usernameKey}:{problemVersionId}:{language}
```

## JavaScript Runner

Use a fresh dedicated Web Worker per test case.

Learner API:

```ts
const input = stdin.trim();
print("answer");
```

Output capture:

- `print(...)` appends text plus newline.
- `console.log(...)` is captured as stdout for familiarity.
- Thrown errors become runtime errors/stderr.

Restrictions:

- No Node APIs promised.
- No `require`.
- No filesystem.
- No npm packages.
- No access to Supabase client, app context, localStorage, or DOM.

Timeout:

- Main thread starts a timer per test.
- On timeout, terminate the worker.
- Mark test as `timeout`.

Output limit:

- Stop or truncate captured output after `limits.outputBytes`.
- Mark excessive output clearly in result details.

## PHP Runner

Define an adapter first:

```ts
interface PhpRunnerAdapter {
  runTest(input: {
    code: string;
    stdin: string;
    timeoutMs: number;
    outputBytes: number;
  }): Promise<{
    stdout: string;
    stderr: string;
    status: "passed_process" | "runtime_error" | "timeout";
    durationMs: number;
  }>;
  dispose(): Promise<void>;
}
```

Runtime strategy:

- Spike a maintained browser PHP runtime before final package lock.
- First spike target: WordPress Playground PHP runtime if it exposes the required stdin/stdout behavior.
- Alternative: a community `php-wasm` package if it bundles better with Vite.
- Avoid a custom PHP WASM build in v1.

Execution strategy:

- Prefer fresh worker/runtime per test for correctness.
- Reuse only if startup cost is unacceptable and reset behavior is proven safe.
- Provide stdin to PHP `STDIN`.
- Capture normal stdout and stderr.

## Test Result Flow

1. User clicks Run.
2. UI reads visible tests from the active problem version.
3. Runner executes each test in isolation.
4. UI compares stdout by normalizing line endings and trimming trailing whitespace.
5. UI shows per-case results.
6. If run completes, UI uploads code snapshot to `submission-code`.
7. UI calls `commit_submission`.
8. UI invalidates submissions, progress, and activity queries.

Result display:

- Summary: passed/total.
- Case detail: stdin, expected stdout, actual stdout, stderr, duration.
- Runtime errors and timeouts are separate from assertion failures.
- Use "local result" and "passed visible tests", not "verified".

## Submission Browser

Provide both:

- Per-problem submissions tab.
- Global `/submissions` route.

Filters:

- Problem.
- Username.
- Language.
- Solved/pass status.
- Version.
- Pinned best.

List data:

- Username.
- Problem title.
- Version.
- Language.
- Pass count.
- Timestamp.
- Pinned best flag.
- Code preview.

Detail data:

- Download full source from Storage on demand.
- Show syntax-highlighted source.
- Show result JSON details.

Submitted source is visible to all logged-in users by design.

## Pin Best Flow

1. User opens a submission.
2. User clicks Pin Best.
3. UI calls `pin_best_submission`.
4. RPC unpins previous best for the same username/problem/language.
5. RPC inserts `pinned_best_submission` activity event.
6. UI invalidates submissions, progress, and activity.

The UI must not auto-rank best submissions from duration or code size.

## Activity Feed

Subscribe after username login:

- Channel listens to Postgres changes on `activity_events`.
- Keep a bounded in-memory list.
- Refetch recent events on reconnect.

Show:

- Started attempting.
- Submitted attempt.
- Solved problem.
- Published problem.
- Pinned best submission.

Do not deduplicate in v1.

## Currently Attempting Presence

Use Supabase Realtime Presence.

Channel:

```txt
problem:{problemId}:{problemVersionId}
```

Payload:

```ts
{
  usernameKey: string;
  displayUsername: string;
  language: "javascript" | "php";
  joinedAt: string;
}
```

Behavior:

- Track on problem page mount.
- Update payload when language changes.
- Untrack on route leave.
- Show active users near problem metadata.

Opening the problem/editor also inserts a durable `started_attempting` event.

## Upload And Storage UX

MDX:

- Upload raw MDX to `problem-mdx`.
- Store parsed metadata in Postgres.
- Publish through RPC.

Submitted code:

- Upload immutable source snapshot to `submission-code`.
- Store `code_storage_path` and `code_preview` in `submissions`.
- Download full source only when a submission detail is opened.

Drafts:

- LocalStorage immediate backup.
- Postgres debounced remote backup.
- No Storage draft bucket in v1.

## Error Handling

Expected recoverable errors:

- Supabase anonymous sign-in fails.
- Profile upsert fails.
- Problem metadata loads but MDX download fails.
- MDX validates locally but publish RPC rejects it.
- Storage upload succeeds but RPC fails.
- Runner worker times out.
- PHP runtime fails to initialize.
- Realtime disconnects.

UI behavior:

- Show scoped errors near the affected panel.
- Keep draft code in localStorage when remote save fails.
- Offer retry for Storage/RPC failures.
- Refetch server state after reconnect.

## Implementation Order

1. Scaffold Vite React TypeScript app with Yarn.
2. Add React Router, TanStack Query, Supabase client, and session context.
3. Build username gate and profile upsert.
4. Build problem list from Supabase.
5. Build problem detail and version selection.
6. Add CodeMirror editor and draft autosave.
7. Implement JavaScript worker runner.
8. Add run result panel.
9. Implement submission code upload and `commit_submission`.
10. Build submissions tab and global submissions route.
11. Add progress and pin-best flows.
12. Add activity feed and presence.
13. Build MDX upload, validation, draft, and publish.
14. Render MDX in the main React tree with error boundaries.
15. Spike and integrate PHP runner adapter.
16. Polish responsive desktop/mobile layouts.

## Browser Verification Targets

Use browser verification for:

- Login gate blocks all routes before username.
- Problem list filtering and status labels.
- Problem page desktop split layout and mobile tabs.
- JavaScript runner timeout and success/failure states.
- PHP runner once runtime is selected.
- Draft restore after refresh.
- Submission detail source-code download.
- Activity feed realtime updates.
- Presence join/leave.
- MDX upload and publish.

## Risks

- Full MDX in main React tree can access too much app context if component boundaries are careless.
- Browser-only execution can be falsified.
- PHP WASM package choice may delay PHP day-one support.
- Direct Supabase access means browser users can call APIs outside the UI.
- No real privacy for submissions or usernames in v1.

## References

- Supabase anonymous sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Storage quickstart: https://supabase.com/docs/guides/storage/quickstart
- Supabase Realtime Presence: https://supabase.com/docs/guides/realtime/presence
- Supabase JavaScript RPC: https://supabase.com/docs/reference/javascript/rpc
