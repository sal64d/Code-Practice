# UI/Vite Architecture Open Questions

Status: open questions only. Do not treat this as the final UI architecture plan.

Source context:

- Current repo contains planning docs only; no Vite app, package manifest, source tree, or existing UI dependencies constrain these decisions yet.
- Product scope comes from `tasks/prd-logical-programming-learning-app.md`.
- Shared contracts come from `tasks/architecture/shared-interfaces.md`.

## Scope

This question set covers the Vite app architecture for:

- Routing and app shell
- Username login gate and local session state
- Direct Supabase database, storage, and realtime access from the browser
- Problem list, problem detail, version selection, and progress display
- Editor architecture for JavaScript and PHP
- Browser JavaScript runner
- Browser PHP WASM runner
- MDX rendering, upload, validation, draft, publish, and preview UI
- Draft autosave and submitted code storage UX
- Submission browser and code viewing
- Activity feed and currently-attempting presence
- Responsive desktop and mobile layouts
- Any UI flow that might require Vercel Go serverless functions

## Questions

### Q1. What Vite UI stack should be the baseline?

Question: Should the prototype use React with TypeScript, or another Vite-compatible UI stack?

Why it matters: MDX rendering, editor integration, Supabase client integration, and realtime UI patterns all depend on the component framework. The repo has no existing app code, so this is still open.

Options:

- A. Vite + React + TypeScript + React Router.
- B. Vite + React + TypeScript + TanStack Router.
- C. Vite + Vue or Svelte.
- D. Plain Vite with minimal framework code.

Recommended: A. Use Vite + React + TypeScript + React Router for the prototype. It is familiar, integrates well with MDX and editor libraries, and is enough for the app routes without adding route-level complexity.

Answer: I'll set it up using yarn create vite with react + typescript + react compiler.

Downstream impact: Determines package choices, route component shape, how MDX components are registered, how layouts are nested, and how future implementation stories should be split.

### Q2. Should the UI use `supabase-js` or raw Supabase REST calls?

Question: Since the goal is direct Supabase access without a custom backend, should the Vite app call raw PostgREST/Storage endpoints or use `supabase-js`?

Why it matters: The app needs database reads/writes, Storage uploads/downloads, Realtime activity subscriptions, and Presence. Raw REST covers tables, but Realtime and Storage become more manual.

Options:

- A. Use `supabase-js` directly from the browser and wrap it in app-specific data modules.
- B. Use raw `fetch` against PostgREST for tables, plus custom clients for Storage and Realtime.
- C. Generate a typed API layer over Supabase REST and avoid `supabase-js`.

Recommended: A. Use `supabase-js` as the direct browser-to-Supabase client, with thin app-specific modules such as `problemsApi`, `submissionsApi`, and `activityApi`. This still satisfies the "no backend" goal.

Downstream impact: Simplifies uploads, realtime feed, presence, and auth/session plumbing. It also makes generated Supabase database types useful later.

### Q3. How should username-only login be represented in the browser?

Question: Should the username gate be only local app state, or should the UI also create a silent Supabase anonymous auth session after the username is entered?

Why it matters: The product identity is `usernameKey`, not a secure account. But Supabase policies and Realtime may still benefit from distinguishing visitors who have entered the app from raw unauthenticated clients.

Options:

- A. Store only `username` and `usernameKey` in localStorage; use Supabase anon key for all requests.
- B. Store `username` and `usernameKey` in localStorage, then silently create a Supabase anonymous auth session after username entry. Do not use `auth.uid()` as app identity.
- C. Store username in sessionStorage only, so refresh survives but browser restart does not.
- D. Add real Supabase Auth now.

Recommended: B. Keep app identity as `usernameKey`, but create an anonymous Supabase auth session after the username gate if the DB plan can use it. This preserves the prototype rule that entering an existing username resumes that username, while giving Supabase a coarse authenticated role.

Downstream impact: Affects RLS policy shape, Realtime connection identity, local logout/switch-user behavior, and how much protection exists outside the UI gate.

### Q4. How should app state and server state be managed?

Question: Should the UI use a dedicated query/cache library, a global state store, or direct component-level Supabase calls?

Why it matters: Problem lists, progress, submissions, activity, and profile data are shared across routes. Runner state and editor state are local and high-frequency. Mixing these without a pattern can produce stale data and duplicate requests.

Options:

- A. Use TanStack Query for Supabase server state, React context for username session, and local component state for editor/runner state.
- B. Use Zustand for both server state and UI state.
- C. Use only React state/effects and direct Supabase calls from components.
- D. Use Redux Toolkit for all state.

Recommended: A. Use TanStack Query for database/storage-backed state, React context for username session, and local state for editor and runner execution. Add a tiny Zustand store only if cross-route UI state becomes awkward.

Downstream impact: Determines cache invalidation after submissions, publish events, progress changes, realtime updates, and version switching.

### Q5. Where should the unified problem catalog come from?

Question: Should the UI read official repo-backed problems from the Vite bundle and uploaded problems from Supabase, or should all published problem metadata be mirrored into Supabase?

Why it matters: The UI needs one problem list with consistent filtering, version selection, progress joins, and submission links. The shared interface currently models `problems` and `problem_versions` in Supabase.

Options:

- A. Build official problems into a static Vite manifest and merge them client-side with uploaded Supabase problems.
- B. Mirror official problem metadata and versions into Supabase during ingestion, so the UI reads one catalog source.
- C. Store official problems only in the Vite bundle and store uploaded problems only in Supabase permanently.

Recommended: B. The UI should target one normalized Supabase-backed catalog for published problem metadata and versions. Official repo MDX can still be the authoring source, but ingestion should create the same metadata records as uploads.

Downstream impact: Simplifies progress joins, activity feed links, submission browsing, version selection, and search/filter behavior. It creates a dependency on the DB/ingestion plan.

### Q6. How should problem version selection work in the UI?

Question: Should the selected problem version be driven only by Supabase progress, URL params, or local browser state?

Why it matters: The PRD requires new users to see the latest version while existing users return to the version they started unless they switch.

Options:

- A. Use Supabase progress as the source of truth, with optional `?version=` URL override when the user explicitly switches.
- B. Use localStorage as the source of truth for selected version.
- C. Always default to latest version and only show historical submissions separately.

Recommended: A. Use Supabase progress to determine the default version, and use a URL param only for explicit version selection. Persist an explicit switch back into progress.

Downstream impact: Keeps refresh, cross-tab behavior, and problem list status consistent. Requires the UI to handle "solved previous version, latest unsolved" clearly.

### Q7. How should uploaded full MDX be rendered?

Question: Since full MDX is allowed for the internal prototype and any logged-in user can publish it, should uploaded MDX render inside the main React app tree or inside an isolated preview/rendering boundary?

Why it matters: Full MDX can execute JavaScript depending on the renderer. Rendering arbitrary uploaded MDX inside the main app tree risks access to app context, Supabase clients, tokens, route state, and global browser APIs.

Options:

- A. Render uploaded MDX in the main React tree for maximum component flexibility.
- B. Render uploaded MDX inside a sandboxed iframe with a fixed component bridge and no Supabase client exposure.
- C. Restrict uploaded MDX to Markdown plus whitelisted components.
- D. Compile/render uploaded MDX in a Vercel function and send sanitized HTML to the UI.

Recommended: B. Honor the internal-prototype full-MDX decision, but isolate uploaded problem rendering and preview in a sandboxed iframe. Official trusted MDX can use the same renderer for consistency unless implementation complexity argues otherwise.

Downstream impact: Limits what uploaded MDX components can do, but protects the app shell, session, Supabase client, and editor/runner state. It also affects styling, theme propagation, and preview implementation.

Answer: A

### Q8. What should the MDX upload UX validate before saving or publishing?

Question: Should browser-side validation happen before saving a draft, only before publishing, or both?

Why it matters: Any logged-in user can upload and publish. Bad frontmatter or broken test definitions can break problem pages, runners, progress, or submissions.

Options:

- A. Validate only at publish time; drafts can be arbitrary files.
- B. Validate before saving draft and again before publishing.
- C. Save every upload as raw Storage content, then validate asynchronously later.

Recommended: B. Validate frontmatter and required fields before saving draft, then revalidate before publishing. Store the original MDX in Storage and parsed metadata in Supabase.

Downstream impact: Requires a browser-side parser/validator shared with official ingestion. Gives upload UI field-specific errors and prevents invalid drafts from entering normal authoring flows.

### Q9. Should the editor be Monaco, CodeMirror, or something simpler?

Question: Which code editor should the Vite app use for JavaScript and PHP?

Why it matters: The editor affects bundle size, syntax support, mobile usability, worker setup, theming, and future language extensibility.

Options:

- A. Monaco Editor.
- B. CodeMirror 6.
- C. Ace Editor.
- D. Plain textarea for the prototype.

Recommended: B. Use CodeMirror 6 for the prototype. It is lighter than Monaco, works well in Vite, has language packages for JavaScript and PHP-style highlighting, and is easier to make responsive.

Downstream impact: Reduces initial bundle and worker complexity compared with Monaco, but gives up some VS Code-like features. Starter code, autosave, and submission detail views can reuse the same highlighting ecosystem.

### Q10. How should draft code be saved?

Question: Should the editor save drafts directly to Supabase Storage on every change, debounce saves, or save locally first?

Why it matters: Storage writes on every keystroke are noisy and expensive. Saving only remotely risks losing code during network errors. The shared contract prefers Storage paths for draft blobs.

Options:

- A. Save to Supabase Storage on every edit.
- B. Save immediately to localStorage and debounce remote saves to Supabase Storage plus `attempts` metadata.
- C. Save only when the user clicks a Save button.
- D. Store draft code in a database text column instead of Storage.

Recommended: B. Save locally immediately per `usernameKey + problemVersionId + language`, then debounce remote Storage/attempt updates. Show clear "saving", "saved", and "save failed" states.

Downstream impact: Improves resilience during runner crashes or network failures. Requires conflict rules if the same username edits in multiple tabs.

### Q11. How isolated should the JavaScript runner be?

Question: Should JavaScript run in the main thread, a reusable worker, a fresh worker per test, or a sandboxed iframe?

Why it matters: Learner code can contain infinite loops, mutate globals, or throw errors. The runner must not expose Supabase clients or app internals.

Options:

- A. Execute JavaScript in the main thread with `eval`.
- B. Use one reusable Web Worker for all tests.
- C. Use a fresh dedicated Web Worker per test case and terminate it on timeout.
- D. Use a sandboxed iframe for JavaScript execution.

Recommended: C. Use a fresh dedicated Web Worker per test case, with a hard timeout and no Supabase/app globals in scope.

Downstream impact: Gives predictable test isolation and timeout recovery. It may be slower than reusing a worker, but visible-test prototype workloads should be small.

### Q12. What JavaScript stdin/stdout API should learners use?

Question: Should JavaScript solutions receive stdin through a global string, a stream-like helper, or a generated wrapper?

Why it matters: The API appears in starter code and problem examples. It must be easy to explain and consistent with result capture.

Options:

- A. Provide `const stdin: string` globally and `print(value?: unknown): void`; also capture `console.log`.
- B. Provide a Node-like `fs.readFileSync(0, "utf8")` shim.
- C. Provide a function-style harness even though v1 is script-style.
- D. Require users to export a `main(stdin)` function.

Recommended: A. Use a global `stdin` string and `print(...)`, and capture `console.log(...)` as stdout for learner familiarity. Do not promise Node APIs.

Downstream impact: Defines starter code, docs inside problems, test harness code, and how console output is separated from stderr.

### Q13. Which PHP WASM runtime should v1 target?

Question: Which browser-compatible PHP runtime should the UI architecture assume?

Why it matters: PHP WASM choices differ in bundle size, startup time, STDIN support, filesystem behavior, worker support, package maintenance, and Vite compatibility.

Options:

- A. Use an existing browser PHP runtime such as the WordPress Playground PHP runtime if it exposes the needed STDIN/stdout behavior.
- B. Use a community `php-wasm` package if it is simpler to bundle and run in a worker.
- C. Build a custom PHP WASM runtime.
- D. Keep the UI runner behind a `PhpRunnerAdapter` interface and run a spike before locking the package.

Recommended: D, with A as the first spike target. Define a `PhpRunnerAdapter` interface now, then prove STDIN/stdout, stderr, timeout, worker execution, and Vite bundling before finalizing the package. Avoid a custom build for v1.

Downstream impact: This is a blocking dependency for PHP day-one support. The adapter boundary prevents the rest of the UI from depending on a specific runtime API too early.

### Q14. How should PHP runner timeouts and process reset work?

Question: Should PHP WASM execute each test in a fresh worker/runtime, a reused runtime, or a batch run?

Why it matters: PHP global state, filesystem state, and runtime state can leak between tests if reset is incomplete. Timeouts need a reliable kill mechanism.

Options:

- A. Fresh worker/runtime per test.
- B. Reuse one PHP runtime per problem run and manually reset state between tests.
- C. Batch all tests into one PHP process and parse combined output.

Recommended: A for correctness, unless the runtime spike proves startup time is too slow. If startup is too slow, use a reusable worker only with a proven reset strategy.

Downstream impact: Affects perceived run latency, timeout behavior, memory usage, and whether tests can be trusted to be independent.

### Q15. How should a completed test run be persisted?

Question: Should the browser orchestrate multiple Supabase writes, call a Supabase RPC, or call a Vercel function after a run finishes?

Why it matters: A run creates or updates several records: submission code blob, submission metadata, progress, activity events, solved state, pinned state later, and retention cleanup.

Options:

- A. Browser performs sequential Storage and table writes directly.
- B. Browser uploads code to Storage, then calls a Supabase RPC such as `commit_submission`.
- C. Browser calls a Vercel Go function to commit the run.
- D. Persist only submissions, and defer progress/activity updates to later.

Recommended: B if the DB plan supports it. It keeps "no custom backend" while making submission commit, progress update, activity insert, and retention cleanup closer to atomic. If RPC is out of scope, use A with explicit retry/error states.

Downstream impact: Affects UI loading states, duplicate submission prevention, recovery from partial failure, and how much business logic lives in browser code.

### Q16. How should the submissions browser be presented?

Question: Should submissions be mostly a per-problem secondary panel, a global route, or both?

Why it matters: All submitted code is visible to all logged-in users, even before solving. The PRD still says the problem view should remain editor-first.

Options:

- A. Per-problem submissions tab only.
- B. Global submissions route only.
- C. Both: per-problem tab for local context and global submissions route with filters.

Recommended: C. Provide a secondary submissions tab on the problem page and a global submissions view with filters by problem, username, language, pass status, version, and pinned-best status.

Downstream impact: Affects route design, query keys, Storage download patterns for source code, and how much code syntax highlighting is needed outside the editor.

### Q17. How should source code snapshots be loaded for viewing?

Question: Should submission source code be stored inline in the database, downloaded from Supabase Storage on demand, or both?

Why it matters: The user prefers Supabase Storage for user code. The UI still needs fast source display and reliable links from submissions.

Options:

- A. Store only `codeStoragePath` in the database and download code from Storage when a submission is opened.
- B. Store full code inline in the `submissions` table.
- C. Store code in Storage and also store a short preview snippet in the database.

Recommended: C. Store the full source in Storage and a small preview or first N characters in the database for lists. Download the full code on demand for detail views.

Downstream impact: Keeps list views fast while honoring Storage as the code source of record. Requires Storage read policies and UI loading/error states.

### Q18. How should realtime activity feed updates work?

Question: Should the UI subscribe to Supabase Realtime globally after login, poll, or refresh manually?

Why it matters: The PRD expects activity feed updates without a full reload when realtime is available, but feed events are intentionally noisy.

Options:

- A. Subscribe globally to `activity_events` after username login, append new events optimistically, and refetch periodically or on reconnect.
- B. Poll every few seconds and avoid realtime.
- C. Load feed only on page navigation or manual refresh.

Recommended: A. Use Supabase Realtime after login with a bounded in-memory feed and fallback refetch on reconnect. Keep event rendering compact because v1 does not deduplicate.

Downstream impact: Affects Supabase channel usage, feed ordering, cache invalidation, and noisy-feed UI controls.

### Q19. How should currently-attempting presence be scoped?

Question: Should presence be global, per problem, per problem version, or per problem/version/language?

Why it matters: Presence needs to feel useful without flooding every page with irrelevant users.

Options:

- A. One global presence channel for the whole app.
- B. One presence channel per problem.
- C. One presence channel per problem version.
- D. One presence channel per problem version with language included in presence payload.

Recommended: D. Track presence on a problem-version scoped channel and include `usernameKey`, display username, and selected language in the payload.

Downstream impact: Lets the problem page show accurate collaborators for the exact version being solved. Requires cleanup on route changes and language changes.

### Q20. What should the responsive problem-solving layout be?

Question: How should the problem statement, tests, editor, results, submissions, and presence adapt between desktop and mobile?

Why it matters: The app is editor-first but also content-heavy. Poor layout can make mobile unusable and desktop inefficient.

Options:

- A. Desktop split view with problem/tests on the left and editor/results on the right; mobile uses tabs for Problem, Code, Results, and Submissions.
- B. Same split view at all screen sizes.
- C. Single-column page with editor below problem on every screen.
- D. Submission gallery-first layout.

Recommended: A. Use a dense desktop split view and a mobile tab layout. Keep Run controls sticky near the editor on both.

Downstream impact: Drives component boundaries, route-level layout, editor sizing, result panel behavior, and browser verification scenarios.

### Q21. Does any UI flow require Vercel Go functions?

Question: Which, if any, UI flows cannot be handled by direct Supabase access plus browser code?

Why it matters: The preferred architecture has no custom backend. Adding Vercel functions introduces deployment, contracts, error handling, and duplicated validation risks.

Options:

- A. No UI flow uses Vercel functions in v1.
- B. Use Go functions only for MDX validation/compilation.
- C. Use Go functions for publishing and submission commit.
- D. Use Go functions for signed Storage uploads.

Recommended: A for v1. Prefer browser validation plus Supabase RPC for database-side transactions. Introduce Go functions only if MDX rendering, Storage policies, or transactional publishing cannot be made practical with Supabase alone.

Downstream impact: Keeps the UI simpler and confirms that final backend plan can be "no backend except optional future functions." If this changes, shared API interfaces must be added before final UI planning.

### Q22. What Vite environment variables may be exposed to the browser?

Question: Which configuration values should the UI read from `import.meta.env`?

Why it matters: Vite exposes `VITE_` variables to browser bundles. Service-role keys or privileged secrets must never be used in the UI.

Options:

- A. Expose only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and non-secret feature flags.
- B. Expose Supabase service-role key because this is internal-only.
- C. Hide all Supabase config behind Vercel functions.

Recommended: A. The UI must never include Supabase service-role keys, even for the internal prototype.

Downstream impact: Confirms that all direct browser operations must be allowed through anon/authenticated policies, Storage policies, or Supabase RPC with caller-safe permissions.

### Q23. How should the UI communicate prototype trust boundaries?

Question: Should the app explicitly tell users that username identity is weak, submissions are visible, and browser test results are local learning signals?

Why it matters: The PRD intentionally chooses weak identity, full-MDX publishing, visible submissions, and browser-only execution. The UI should not accidentally imply privacy, security, or verified judging.

Options:

- A. Show lightweight notices on login, upload/publish, and submission views.
- B. Put the information only in documentation.
- C. Do not mention it in the UI.

Recommended: A. Use compact, non-blocking UI copy on sensitive flows: username login, MDX publish, and submission/code browsing.

Downstream impact: Reduces misunderstanding without turning the prototype into a warning-heavy product. Affects login copy, publish confirmation, and submission browser labels.

## Blocking Decisions

These need resolution before writing the final UI architecture plan:

- Q1. Vite UI stack baseline
- Q2. Supabase browser access method
- Q3. Username session and optional anonymous Supabase auth
- Q5. Unified problem catalog source
- Q7. Uploaded MDX rendering boundary
- Q9. Editor library choice
- Q11. JavaScript runner isolation
- Q12. JavaScript stdin/stdout API
- Q13. PHP WASM runtime strategy
- Q14. PHP runner isolation/reset strategy
- Q15. Submission persistence workflow
- Q21. Whether any UI flow requires Vercel Go functions
- Q22. Browser-exposed environment variables

## Non-blocking Decisions

These can be adjusted during implementation without invalidating the whole architecture:

- Q4. Exact query/state library split
- Q6. URL details for explicit problem version selection
- Q8. Exact upload form validation timing and preview sequence
- Q10. Autosave debounce interval and save-status copy
- Q16. Exact submissions route and tab placement
- Q17. Whether source preview snippets are stored in the database
- Q18. Activity feed fallback refetch cadence
- Q19. Presence channel naming details
- Q20. Exact responsive breakpoints and panel sizing
- Q23. Exact wording for prototype trust-boundary notices
