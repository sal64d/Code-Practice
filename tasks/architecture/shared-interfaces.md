# Shared Interfaces And Accepted Decisions

Status: accepted v1 architecture contract.

This file is the shared boundary between the Vite UI, Supabase database/storage/realtime layer, and optional future Vercel Go functions. It incorporates the recommended answers from the domain question files, except for explicit UI overrides already present in `ui-open-questions.md`.

## Accepted Architecture

- UI: Vite + React + TypeScript + React Router, created with Yarn, with React Compiler enabled when the project toolchain supports it.
- Browser data access: use `supabase-js` directly from the Vite app. This still satisfies the no-custom-backend goal because it talks to Supabase APIs directly.
- Auth gate: after username entry, create a Supabase anonymous auth session. The anonymous auth user is only a transport/session gate.
- App identity: `username_key` is the canonical app identity. Entering an existing username resumes that username.
- Database: Supabase Postgres stores metadata, drafts, results, progress, activity, and version state.
- Storage: Supabase Storage stores uploaded MDX files and immutable submitted code snapshots.
- Draft code: latest draft code is stored in Postgres for simple autosave, with localStorage used as an immediate browser safety buffer.
- Realtime: Supabase Realtime drives durable activity feed updates and ephemeral currently-attempting presence.
- Backend: no Vercel Go functions in v1. Use Supabase RPC for database-local transactions.
- Future backend: add Go only for secrets, signed upload URLs, physical Storage cleanup, external services, or cross-service orchestration that Supabase cannot handle cleanly.

## Explicit Overrides

- Uploaded full MDX renders in the main React tree for the internal prototype. This was explicitly chosen over iframe isolation.
- The app should still document that full MDX in the main tree is unsafe for untrusted public use.
- The UI stack should use Vite + React + TypeScript, created with Yarn, and include React Compiler support when practical.

## Naming And Identity

```ts
type Username = string;
type UsernameKey = string;
```

Normalization:

- `Username`: preserve latest entered display text after trimming.
- `UsernameKey`: lowercase, trim outer whitespace, collapse internal whitespace to `-`, and allow only `[a-z0-9_-]`.
- Database constraint: `username_key` must match `^[a-z0-9_-]{1,40}$`.
- Entering an existing `UsernameKey` resumes that profile.

Risk:

- This intentionally permits impersonation.
- Supabase anonymous auth does not secure identity; it only distinguishes users who passed the username gate from raw unauthenticated visitors.

## Core IDs

```ts
type ProblemId = string;
type ProblemVersionId = string;
type SubmissionId = string;
type ActivityEventId = string;
type StoragePath = string;
type ISODateTime = string;
```

## Enums

```ts
type Language = "javascript" | "php";
type Difficulty = "easy" | "medium" | "hard";
type ProblemSourceType = "official_repo" | "user_upload";
type ProblemVersionStatus = "draft" | "published" | "archived";

type ActivityEventType =
  | "started_attempting"
  | "submitted_attempt"
  | "solved_problem"
  | "published_problem"
  | "pinned_best_submission";

type ProblemCompletionState =
  | "unattempted"
  | "attempted"
  | "solved_current_version"
  | "solved_previous_version_latest_unsolved";
```

## Problem MDX Frontmatter Contract

```ts
interface ProblemFrontmatter {
  id: ProblemId;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  supportedLanguages: Language[];
  starterCode: Record<Language, string>;
  tests: {
    visible: VisibleTestCase[];
  };
  limits?: ProblemLimits;

  // Optional future metadata. Not used by v1 stdin/stdout runners.
  entrypoint?: string;
  signature?: ProblemSignature;
}

interface VisibleTestCase {
  name?: string;
  stdin: string;
  stdout: string;
}

interface ProblemLimits {
  timeMs?: number;
  outputBytes?: number;
}

interface ProblemSignature {
  args: Array<{ name: string; type: string }>;
  returns: string;
}
```

Validation:

- `id` is a stable slug.
- `title` is non-empty.
- `difficulty` is `easy`, `medium`, or `hard`.
- `supportedLanguages` contains at least one v1 language.
- `starterCode` exists for every supported language.
- `tests.visible` contains at least one test.
- Every visible test has `stdin` and `stdout` strings.
- No hidden tests in v1.

## Problem Version Document

```ts
interface ProblemVersionDocument {
  problemVersionId: ProblemVersionId;
  problem: ProblemFrontmatter;
  mdxBody: string;
  mdxStoragePath: StoragePath;
  contentHash: string;
  versionNumber?: number;
}
```

Raw MDX lives in Storage. Postgres stores parsed metadata, content hash, version state, and the Storage path.
Draft versions use a client-generated `problemVersionId` before upload. `versionNumber` is assigned when the draft is published.

## Runner Contract

Both languages use script-style stdin/stdout.

```ts
interface RunRequest {
  usernameKey: UsernameKey;
  problemId: ProblemId;
  problemVersionId: ProblemVersionId;
  language: Language;
  code: string;
  tests: VisibleTestCase[];
  limits: Required<ProblemLimits>;
}

interface RunResult {
  language: Language;
  passed: number;
  total: number;
  status: "passed" | "failed" | "timeout" | "runtime_error";
  durationMs: number;
  stdoutBytes: number;
  cases: TestCaseResult[];
  aggregateStdout?: string;
  aggregateStderr?: string;
}

interface TestCaseResult {
  name?: string;
  index: number;
  passed: boolean;
  status: "passed" | "failed" | "timeout" | "runtime_error";
  stdin: string;
  expectedStdout: string;
  actualStdout: string;
  stderr?: string;
  durationMs: number;
}
```

Output comparison:

- Normalize line endings to `\n`.
- Trim trailing whitespace at the end of the whole output.
- Preserve internal whitespace.

Default limits:

- `timeMs`: 1000.
- `outputBytes`: 65536.

JavaScript runner API:

```ts
declare const stdin: string;
declare function print(value?: unknown): void;
```

JavaScript behavior:

- Run each test in a fresh dedicated Web Worker.
- Provide global `stdin`.
- Capture `print(...)` and `console.log(...)` as stdout.
- Capture thrown errors as stderr.
- Do not promise Node APIs, `require`, filesystem access, or npm packages.

PHP runner behavior:

- Define a `PhpRunnerAdapter` first.
- Spike an existing browser PHP runtime before locking the package.
- First spike target: WordPress Playground PHP runtime or another maintained PHP WASM package that supports worker execution, stdin, stdout, stderr, and reset/timeout behavior.
- Prefer a fresh worker/runtime per test unless startup cost is too high and reset can be proven safe.

## Draft Attempt Contract

```ts
interface AttemptRecord {
  usernameKey: UsernameKey;
  problemId: ProblemId;
  problemVersionId: ProblemVersionId;
  language: Language;
  codeText: string;
  updatedAt: ISODateTime;
}
```

Draft behavior:

- Local UI saves immediately to localStorage.
- Remote save debounces into Postgres `attempts.code_text`.
- Unique key: `username_key + problem_version_id + language`.
- Conflict rule for v1: last write wins.

## Submission Contract

```ts
interface SubmissionCreateInput {
  id: SubmissionId;
  usernameKey: UsernameKey;
  problemId: ProblemId;
  problemVersionId: ProblemVersionId;
  language: Language;
  codeStoragePath: StoragePath;
  codePreview: string;
  result: RunResult;
  createdAt: ISODateTime;
}

interface SubmissionRecord extends SubmissionCreateInput {
  passed: number;
  total: number;
  solved: boolean;
  pinnedBest: boolean;
  archived: boolean;
}
```

Submission behavior:

- The browser runs tests.
- The browser generates `SubmissionId`.
- The browser uploads immutable code to Storage using that id in the path.
- The browser calls Supabase RPC `commit_submission`.
- The RPC inserts submission metadata, updates progress, inserts activity events, records solved versions when applicable, and logically prunes older non-pinned submissions.

Retention:

- Keep latest draft.
- Keep pinned best submission.
- Keep last 20 submissions per `username_key + problem_id + language`.
- Older non-pinned submissions are marked archived in v1.
- Physical Storage deletion is deferred.

## Progress Contract

Progress is normalized in Postgres.

```ts
interface ProblemProgressRecord {
  usernameKey: UsernameKey;
  problemId: ProblemId;
  startedProblemVersionId: ProblemVersionId;
  latestAttemptedProblemVersionId: ProblemVersionId;
  overallState: ProblemCompletionState;
  pinnedBestSubmissionId?: SubmissionId;
  lastActivityAt: ISODateTime;
}

interface LanguageProgressRecord {
  usernameKey: UsernameKey;
  problemId: ProblemId;
  language: Language;
  attempted: boolean;
  latestSubmissionId?: SubmissionId;
  pinnedBestSubmissionId?: SubmissionId;
  lastActivityAt: ISODateTime;
}

interface SolvedVersionRecord {
  usernameKey: UsernameKey;
  problemId: ProblemId;
  problemVersionId: ProblemVersionId;
  language: Language;
  submissionId: SubmissionId;
  solvedAt: ISODateTime;
}
```

Version behavior:

- New users start on latest published version.
- Existing users return to their started version unless they explicitly switch.
- Solving an older version remains visible if the latest version is unsolved.

## Activity Event Contract

```ts
interface ActivityEventRecord {
  id: ActivityEventId;
  type: ActivityEventType;
  usernameKey: UsernameKey;
  displayUsername: string;
  problemId?: ProblemId;
  problemTitle?: string;
  problemVersionId?: ProblemVersionId;
  problemVersionNumber?: number;
  submissionId?: SubmissionId;
  language?: Language;
  submissionSolved?: boolean;
  createdAt: ISODateTime;
}
```

Behavior:

- Durable events live in Postgres.
- Events are append-only in v1.
- Events are visible to all authenticated prototype users.
- Events are not deduplicated.
- Draft uploads do not create events.
- Publishing creates `published_problem`.
- Pinning best creates `pinned_best_submission`.

## Storage Buckets And Paths

Buckets:

- `problem-mdx`: private bucket; raw uploaded and official mirrored MDX.
- `submission-code`: private bucket; immutable submitted source code snapshots.

Paths:

```txt
problem-mdx/{problemId}/{problemVersionId}/{contentHash}.mdx
submission-code/{usernameKey}/{problemId}/{problemVersionId}/{language}/{submissionId}.{ext}
```

Extensions:

- JavaScript: `.js`
- PHP: `.php`

Policies:

- Buckets are private, not public.
- Authenticated anonymous sessions get broad read/write access according to prototype rules.
- Submitted code is visible to all logged-in users.
- Service-role keys are never exposed to the browser.

## Supabase RPC Contracts

Use RPC for compound database mutations:

```txt
upsert_profile(username_key, display_username)
publish_problem_version(draft_version_id)
commit_submission(input jsonb)
pin_best_submission(submission_id, username_key)
switch_problem_version(username_key, problem_id, problem_version_id)
```

Plain table/Storage operations are acceptable for:

- Problem list reads.
- Problem detail metadata reads.
- Downloading MDX by Storage path.
- Saving draft code to `attempts`.
- Uploading MDX before publish.
- Uploading submission code before `commit_submission`.
- Inserting noisy `started_attempting` events directly.
- Reading submissions and downloading submitted code.

## Realtime Contracts

Activity feed:

- Subscribe to Postgres changes on `activity_events`.
- Use bounded in-memory feed state.
- Refetch on reconnect.

Presence:

- Use Supabase Realtime Presence.
- Channel name: `problem:{problemId}:{problemVersionId}`.
- Payload includes `usernameKey`, display username, and selected language.

## Browser Environment Variables

Allowed:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY
VITE_FEATURE_*
```

Use either the newer Supabase publishable key or existing anon key depending on project setup.

Forbidden:

```txt
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD
```

## Optional Vercel Go Contract

No Go backend is part of v1.

If added later, allowed endpoint candidates are:

```txt
POST /api/create-signed-upload
POST /api/cleanup-submissions
POST /api/validate-mdx
POST /api/publish-problem
```

Rules:

- Prefer Supabase RPC for database-local transactions.
- Go may use service-role keys only as server-side Vercel environment variables.
- Go functions should call Supabase RPC/REST over HTTP rather than duplicate transaction logic.
- Add CORS allowlists only when functions exist.

## Platform References

- Supabase anonymous sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Storage uploads/downloads: https://supabase.com/docs/guides/storage/quickstart
- Supabase private Storage downloads: https://supabase.com/docs/guides/storage/serving/downloads
- Supabase Realtime Presence: https://supabase.com/docs/guides/realtime/presence
- Supabase JavaScript RPC: https://supabase.com/docs/reference/javascript/rpc
- Vercel Go runtime: https://vercel.com/docs/functions/runtimes/go
