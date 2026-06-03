# Supabase DB, Storage, And Realtime Design

Status: accepted v1 design.

This plan uses the recommended answers from `db-open-questions.md` and the accepted shared contract in `shared-interfaces.md`.

## Purpose

Supabase is the primary backend for the prototype. The Vite UI talks directly to Supabase through `supabase-js`, PostgREST, Storage, Realtime, and Postgres RPC. There is no custom application server in v1.

The database must support weak username identity, visible submissions, browser-produced run results, problem versioning, and uploaded MDX publishing without pretending to provide secure user accounts.

## Accepted Decisions

- Use Supabase anonymous auth after username entry as a coarse authenticated transport gate.
- Use `profiles.username_key` as the canonical app identity and primary key.
- Store latest draft code in Postgres `attempts.code_text`.
- Store raw MDX and immutable submitted code snapshots in Supabase Storage.
- Seed official repo-backed problems into Supabase outside the browser.
- Model drafts and published problem versions in one `problem_versions` table with a `status` column.
- Use Supabase RPC for compound mutations.
- Store normalized progress across `problem_progress`, `language_progress`, and `solved_versions`.
- Keep one pinned best submission per `username_key + problem_id + language`.
- Logically archive old non-pinned submissions instead of deleting rows immediately.
- Use Postgres `activity_events` for durable feed events and Realtime Presence for currently-attempting state.
- Use private Storage buckets with broad authenticated prototype policies.
- Use Supabase CLI migrations and generated TypeScript database types.

## Schema Overview

### Extensions And Types

Use UUID generation and enum types.

```sql
create extension if not exists pgcrypto;

create type language as enum ('javascript', 'php');
create type difficulty as enum ('easy', 'medium', 'hard');
create type problem_source_type as enum ('official_repo', 'user_upload');
create type problem_version_status as enum ('draft', 'published', 'archived');
create type activity_event_type as enum (
  'started_attempting',
  'submitted_attempt',
  'solved_problem',
  'published_problem',
  'pinned_best_submission'
);
```

### `profiles`

Stores prototype usernames.

```sql
profiles (
  username_key text primary key,
  display_username text not null,
  last_auth_user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (username_key ~ '^[a-z0-9_-]{1,40}$')
)
```

`last_auth_user_id` is only diagnostic. It must not be used as the product identity in v1.

### `problems`

Stores the stable problem identity and list metadata.

```sql
problems (
  id text primary key,
  source_type problem_source_type not null,
  title text not null,
  difficulty difficulty not null,
  tags text[] not null default '{}',
  supported_languages language[] not null,
  current_published_version_id uuid null,
  created_by_username_key text references profiles(username_key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Add a foreign key from `current_published_version_id` to `problem_versions.id` after both tables exist.

### `problem_versions`

Stores draft, published, and archived versions.

```sql
problem_versions (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references problems(id),
  version_number integer null,
  status problem_version_status not null default 'draft',
  title text not null,
  difficulty difficulty not null,
  tags text[] not null default '{}',
  supported_languages language[] not null,
  visible_test_count integer not null,
  parsed_frontmatter jsonb not null,
  mdx_storage_path text not null,
  content_hash text not null,
  created_by_username_key text references profiles(username_key),
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (problem_id, content_hash),
  check (visible_test_count > 0)
)
```

Draft rows may have `version_number = null`. Publishing assigns the next version number atomically. Add a partial unique index:

```sql
create unique index problem_versions_unique_number
on problem_versions (problem_id, version_number)
where version_number is not null;
```

Published versions must have valid parsed metadata. Full MDX safety is not enforced by Postgres; only structured frontmatter invariants are enforced.

### `attempts`

Stores latest draft code per username, problem version, and language.

```sql
attempts (
  username_key text not null references profiles(username_key),
  problem_id text not null references problems(id),
  problem_version_id uuid not null references problem_versions(id),
  language language not null,
  code_text text not null,
  updated_at timestamptz not null default now(),
  primary key (username_key, problem_version_id, language)
)
```

Drafts are Postgres text for simple debounced autosave. The UI also keeps localStorage as an immediate recovery buffer.

### `submissions`

Stores immutable submitted result metadata and a Storage path for full code.

```sql
submissions (
  id uuid primary key default gen_random_uuid(),
  username_key text not null references profiles(username_key),
  problem_id text not null references problems(id),
  problem_version_id uuid not null references problem_versions(id),
  language language not null,
  code_storage_path text not null,
  code_preview text not null default '',
  result jsonb not null,
  passed integer not null,
  total integer not null,
  solved boolean not null,
  pinned_best boolean not null default false,
  archived boolean not null default false,
  duration_ms integer not null,
  stdout_bytes integer not null,
  created_at timestamptz not null default now(),
  check (passed >= 0),
  check (total > 0),
  check (passed <= total)
)
```

Pinned best uniqueness:

```sql
create unique index submissions_one_pinned_best
on submissions (username_key, problem_id, language)
where pinned_best;
```

### `problem_progress`

Stores overall problem progress for fast list rendering.

```sql
problem_progress (
  username_key text not null references profiles(username_key),
  problem_id text not null references problems(id),
  started_problem_version_id uuid not null references problem_versions(id),
  latest_attempted_problem_version_id uuid not null references problem_versions(id),
  overall_state text not null,
  pinned_best_submission_id uuid references submissions(id),
  last_activity_at timestamptz not null default now(),
  primary key (username_key, problem_id)
)
```

`overall_state` values match `ProblemCompletionState` in the shared contract.

### `language_progress`

Stores language-specific progress.

```sql
language_progress (
  username_key text not null references profiles(username_key),
  problem_id text not null references problems(id),
  language language not null,
  attempted boolean not null default false,
  latest_submission_id uuid references submissions(id),
  pinned_best_submission_id uuid references submissions(id),
  last_activity_at timestamptz not null default now(),
  primary key (username_key, problem_id, language)
)
```

### `solved_versions`

Preserves solved status even if older submissions are later archived.

```sql
solved_versions (
  username_key text not null references profiles(username_key),
  problem_id text not null references problems(id),
  problem_version_id uuid not null references problem_versions(id),
  language language not null,
  submission_id uuid not null references submissions(id),
  solved_at timestamptz not null default now(),
  primary key (username_key, problem_version_id, language)
)
```

### `activity_events`

Stores durable feed events.

```sql
activity_events (
  id uuid primary key default gen_random_uuid(),
  type activity_event_type not null,
  username_key text not null,
  display_username text not null,
  problem_id text null,
  problem_title text null,
  problem_version_id uuid null,
  problem_version_number integer null,
  submission_id uuid null,
  language language null,
  submission_solved boolean null,
  created_at timestamptz not null default now()
)
```

Events are append-only in v1. Store display snapshots so the feed renders even if related rows are archived.

## Storage Design

Create private buckets:

- `problem-mdx`
- `submission-code`

Paths:

```txt
problem-mdx/{problemId}/{problemVersionId}/{contentHash}.mdx
submission-code/{usernameKey}/{problemId}/{problemVersionId}/{language}/{submissionId}.{ext}
```

Policy shape:

- Allow authenticated users to read both buckets.
- Allow authenticated users to insert into both buckets.
- Allow authenticated users to update/delete only if needed for prototype cleanup; otherwise avoid broad delete in v1.
- Do not make buckets public.

This matches the prototype: all logged-in users can read submissions, but unauthenticated public URLs are avoided.

## RPC Functions

### `upsert_profile`

Input:

- `username_key text`
- `display_username text`

Behavior:

- Validates username key shape.
- Inserts or updates `profiles`.
- Stores `auth.uid()` as `last_auth_user_id` for diagnostics.
- Returns profile row.

### `publish_problem_version`

Input:

- `draft_version_id uuid`

Behavior:

- Validates `problem_versions.status = 'draft'`.
- Validates parsed frontmatter fields Postgres can check.
- Creates or updates `problems`.
- Assigns the next `version_number` atomically.
- Marks version `published`.
- Updates `problems.current_published_version_id`.
- Inserts `published_problem` activity event.
- Returns published problem/version metadata.

The MDX object must be uploaded before this RPC is called. The browser may generate the draft `problem_versions.id` before upload so the Storage path can include the version id.

### `commit_submission`

Input:

- JSON payload matching `SubmissionCreateInput`.

Behavior:

- Validates problem version exists and language is supported.
- Inserts immutable submission metadata using the client-generated submission id from the input.
- Marks `solved = passed = total`.
- Upserts `problem_progress`.
- Upserts `language_progress`.
- Inserts `solved_versions` when solved.
- Inserts `submitted_attempt` activity event.
- Inserts `solved_problem` activity event when this version/language was not already solved.
- Applies logical retention: archive old non-pinned submissions beyond the last 20 per `username_key + problem_id + language`.
- Returns submission id and updated progress summary.

The code snapshot must be uploaded to Storage before this RPC is called.

### `pin_best_submission`

Input:

- `submission_id uuid`
- `username_key text`

Behavior:

- Validates submission exists for the username.
- Clears existing pinned best for `username_key + problem_id + language`.
- Sets the selected submission as pinned.
- Updates `problem_progress` and `language_progress`.
- Inserts `pinned_best_submission` activity event.

### `switch_problem_version`

Input:

- `username_key text`
- `problem_id text`
- `problem_version_id uuid`

Behavior:

- Validates version is published.
- Updates `problem_progress.latest_attempted_problem_version_id`.
- Does not erase previous solved status.

## Direct Table Writes

Allowed direct writes from the browser:

- Upsert draft code in `attempts`.
- Insert `started_attempting` events.

All compound writes use RPC.

## Realtime

Activity feed:

- Enable Realtime Postgres Changes for `activity_events`.
- UI subscribes after username login.
- UI refetches recent events on reconnect.

Presence:

- Use Realtime Presence channels, not a table.
- Channel name: `problem:{problem_id}:{problem_version_id}`.
- Payload: `usernameKey`, display username, selected language, joined timestamp.

## Indexes

Add focused composite indexes:

```sql
create index problem_versions_problem_status_version
on problem_versions (problem_id, status, version_number desc);

create index submissions_user_problem_language_created
on submissions (username_key, problem_id, language, created_at desc);

create index submissions_problem_version_created
on submissions (problem_id, problem_version_id, created_at desc);

create index submissions_problem_created
on submissions (problem_id, created_at desc);

create index activity_events_created
on activity_events (created_at desc);

create index solved_versions_user_problem
on solved_versions (username_key, problem_id, language);
```

Primary keys and unique constraints cover attempts and progress lookups.

## Official Problem Ingestion

Official repo MDX should be seeded into Supabase outside the browser:

1. Parse official MDX files from the repo.
2. Validate with the same TypeScript schema used by upload UI.
3. Upload raw MDX to `problem-mdx`.
4. Upsert `problems` and `problem_versions` using service-role credentials in a local/deploy script.
5. Generate or preserve version numbers and content hashes.

The service-role key is only used by scripts or future server-side functions, never by the Vite app.

## Access Model

The app uses Supabase anonymous auth after username entry.

Policy direction:

- Tables and buckets should require `auth.role() = 'authenticated'`.
- Policies can be broad for authenticated users because the prototype intentionally allows username impersonation and all-submission visibility.
- Do not document this as strong privacy.
- Do not expose service-role keys in Vite.

This prevents raw unauthenticated reads through the UI path but does not stop someone from creating an anonymous session and using the API.

## Migration And Types Workflow

- Use Supabase CLI migrations committed to the repo.
- Use generated TypeScript database types for the Vite app.
- Keep DB enum names aligned with `shared-interfaces.md`.
- Add seed scripts for official problems after schema migrations.

Expected future files:

```txt
supabase/migrations/*.sql
supabase/seed.sql
src/types/supabase.ts
scripts/seed-official-problems.ts
```

## Retention And Cleanup

V1 retention:

- `commit_submission` marks old non-pinned submissions as `archived = true`.
- Normal submission lists hide archived submissions unless a debug filter is enabled.
- Activity events remain append-only.
- Solved status remains in `solved_versions`.
- Storage objects for archived submissions are not deleted in v1.

Future cleanup:

- Add a scheduled Supabase job or Vercel Go function only if Storage cost or orphaned files become a real problem.

## Risks

- Username identity is weak by design.
- Broad authenticated policies are acceptable only for the internal prototype.
- Storage and Postgres writes are not atomic; upload-first plus RPC metadata is the accepted compromise.
- Browser-produced run results can be falsified and must remain learning signals only.
- Full MDX in the main React tree is unsafe for untrusted deployment.

## Implementation Order

1. Create Supabase project and enable anonymous auth.
2. Add migrations for enums, tables, constraints, indexes, and Storage buckets.
3. Add broad authenticated prototype policies.
4. Add RPC functions.
5. Generate TypeScript database types.
6. Build official problem seed script.
7. Wire UI data modules to table reads and RPC calls.
8. Enable Realtime for `activity_events`.
9. Verify Storage upload/download for MDX and submitted code.

## References

- Supabase anonymous sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Storage quickstart: https://supabase.com/docs/guides/storage/quickstart
- Supabase private Storage downloads: https://supabase.com/docs/guides/storage/serving/downloads
- Supabase Realtime Presence: https://supabase.com/docs/guides/realtime/presence
- Supabase JavaScript RPC: https://supabase.com/docs/reference/javascript/rpc
