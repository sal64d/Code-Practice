# DB/Supabase Open Questions

Status: open questions only. This is not a final architecture plan.

Inputs read:

- `tasks/prd-logical-programming-learning-app.md`
- `tasks/architecture/shared-interfaces.md`

## Scope

This file covers unresolved DB/Supabase architecture decisions for:

- Supabase Postgres schema.
- Direct REST/PostgREST access from the Vite UI.
- Supabase Storage buckets and policies for MDX and user code.
- Supabase Realtime for activity feed and currently-attempting presence.
- RPC functions, triggers, and whether they are needed without a custom backend.
- Submission retention and cleanup.

The product context is an internal prototype with weak username identity. Entering an existing username resumes that username. All logged-in users can see all submissions and submitted code. Any logged-in user can upload, publish, and revise full MDX problems.

## Open Questions

### DBQ-001: What Supabase auth state backs the app's "logged-in" user?

**Question:** When a user enters a username, should the app also create a Supabase anonymous auth session, or should all browser requests use only the public anon API key with permissive policies?

**Why it matters:** The PRD says no app content before username login, but Supabase cannot enforce that unless there is some auth state or all policies remain open to the `anon` role. This affects PostgREST policies, Storage policies, Realtime access, and whether "logged-in users only" exists outside the UI.

**Options:**

- A. Use Supabase anonymous auth after username entry. The anonymous auth user is only a transport/session gate; `username_key` remains the app identity.
- B. Do not use Supabase Auth. Use the public anon key and permissive `anon` policies for all prototype data access.
- C. Add passwordless email/magic link now.
- D. Use a Vercel Go API layer to create app sessions and proxy Supabase writes.

**Recommended:** A. Use Supabase anonymous auth as a minimal "entered username" gate, while still keying data by `username_key`.

**Downstream impact:** Policies can target `auth.role() = 'authenticated'` instead of fully open `anon` access. This does not prevent impersonation because `username_key` is still user-controlled, but it gives the UI a cleaner gate and makes Realtime/Storage policies easier to express.

### DBQ-002: What is the canonical user key in Postgres?

**Question:** Should `profiles.username_key` be the primary key, or should profiles have a UUID primary key with `username_key` as a unique field?

**Why it matters:** The PRD requires entering an existing username to resume that profile. If every major table is keyed by username, schema and queries stay direct. If a UUID is introduced, the app must resolve username to profile id before every write.

**Options:**

- A. Use `username_key text primary key` in `profiles` and reference it directly in attempts, submissions, progress, and activity.
- B. Use `profiles.id uuid primary key` and keep `username_key text unique`.
- C. Store no profile table; treat username strings as free-form fields everywhere.

**Recommended:** A. Use `username_key` as the profile primary key for v1.

**Downstream impact:** This matches prototype identity exactly. It also means renaming usernames is out of scope unless a future migration updates every dependent row.

### DBQ-003: How much username validation should the database enforce?

**Question:** Should username normalization and validity be enforced only in the UI, or also in the database?

**Why it matters:** With direct Supabase access, clients can bypass UI validation. Even for a prototype, bad username keys would make Storage paths, joins, and indexes messy.

**Options:**

- A. UI-only normalization and validation.
- B. UI normalization plus database `CHECK` constraints on `username_key`.
- C. A Supabase RPC such as `upsert_profile(raw_username)` performs normalization in Postgres and rejects invalid input.

**Recommended:** B for v1, with C optional if profile creation becomes inconsistent.

**Downstream impact:** Tables should constrain `username_key` to a practical slug, for example `^[a-z0-9_-]{1,40}$`. The UI can still preserve display text separately as `display_username`.

### DBQ-004: Should user code be stored in Supabase Storage or Postgres tables?

**Question:** Should latest drafts and immutable submission code snapshots both live in Storage, or should some code live directly in Postgres?

**Why it matters:** Storage is good for files, but Storage writes and Postgres writes are not one transaction. Draft autosave is frequent and small; submission code snapshots are immutable and public to logged-in users.

**Options:**

- A. Store both drafts and submission code in Storage. Tables store metadata and `code_storage_path`.
- B. Store drafts in Postgres `text`, store immutable submission code in Storage.
- C. Store all code in Postgres `text` for v1.
- D. Store all code in Storage and use Vercel functions for atomic-ish orchestration.

**Recommended:** B. Store drafts in Postgres for simple autosave, and store immutable submission snapshots in Storage.

**Downstream impact:** This changes the shared interface slightly: `attempts` can keep `code_text` instead of `codeStoragePath`. Submissions still follow the Storage path contract. If the user strongly wants all code in Storage, DBQ-010 becomes more important because broken metadata/object pairs are possible.

### DBQ-005: Where should raw MDX and parsed problem metadata live?

**Question:** Should the database store full raw MDX, or should raw MDX live only in Storage while Postgres stores parsed metadata and a storage path?

**Why it matters:** Problem lists need fast metadata queries. Problem details need the full MDX body. Versioning needs stable content hashes and historical traceability.

**Options:**

- A. Raw MDX in Storage only; Postgres stores metadata, parsed schema JSON, content hash, and `mdx_storage_path`.
- B. Raw MDX in Postgres only.
- C. Raw MDX in both Storage and Postgres.

**Recommended:** A. Store raw MDX in Storage and parsed metadata in Postgres.

**Downstream impact:** Problem list queries do not download MDX files. Problem detail fetches `problem_versions` first, then downloads the MDX object. Cleanup must preserve Storage objects for every published version that has historical submissions.

### DBQ-006: How are official repo-backed problems represented in Supabase?

**Question:** Should official repo MDX problems be seeded into Supabase, or should they stay in the Vite bundle while only uploaded problems live in Supabase?

**Why it matters:** Submissions, progress, activity events, and version rules all reference `problem_id` and `problem_version_id`. A split local/remote source can complicate joins and progress queries.

**Options:**

- A. Seed official problems into Supabase using a migration/seed script or build/deploy task with service-role credentials.
- B. Keep official problems as a static Vite manifest and store only uploaded problems in Supabase.
- C. On first client load, let the browser upsert official problems into Supabase using permissive policies.

**Recommended:** A. Seed official problems into Supabase outside the browser.

**Downstream impact:** The UI can query one unified problem catalog. The service-role key must never be shipped to the browser. If Vercel build-time seeding is used, it is still not a runtime backend, but it does require secure environment variables.

### DBQ-007: What tables model problems and versions?

**Question:** Should drafts, published versions, and upload records be separate tables, or should one `problem_versions` table handle all statuses?

**Why it matters:** The PRD allows draft uploads, publish, edit-after-publish as new version, latest version for new users, and historical submissions tied to exact versions.

**Options:**

- A. Use `problems` plus `problem_versions`; `problem_versions.status` is `draft`, `published`, or `archived`.
- B. Use separate `problem_uploads`, `problem_versions`, and `published_problem_versions` tables.
- C. Store uploaded drafts only in Storage until publish.

**Recommended:** A. Use one `problem_versions` table with a status column and enough metadata to validate/publish.

**Downstream impact:** Publishing becomes an atomic transition from draft to published plus updating `problems.current_published_version_id`. Draft uploads can remain hidden from the problem list with a simple status filter.

### DBQ-008: Who enforces uploaded MDX validation?

**Question:** Since any logged-in prototype user can publish full MDX, should schema validation be trusted from the UI, enforced in Postgres constraints, or delegated to a function?

**Why it matters:** Postgres cannot fully validate arbitrary MDX semantics. Direct REST writes could create invalid published versions unless publish is controlled.

**Options:**

- A. UI-only validation. Accept that direct API writes can bypass it in the prototype.
- B. UI validation plus database constraints for fields Postgres can validate: slug, status, supported languages, visible test count, parsed schema JSON shape.
- C. Publish only through a Supabase RPC that checks required parsed fields and transitions state atomically.
- D. Publish through a Vercel Go function that parses and validates MDX server-side.

**Recommended:** C, with UI validation before calling the RPC. Avoid custom Go unless MDX parsing must happen server-side.

**Downstream impact:** The UI can still render validation errors early. The database gets a minimal publish gate so published rows are less likely to be malformed. Full MDX execution safety remains outside DB scope.

### DBQ-009: Should direct REST writes be pure CRUD, or should Supabase RPC be used for compound mutations?

**Question:** Can the Vite app perform multi-step writes through direct table operations, or should important operations use Postgres RPC functions exposed through PostgREST?

**Why it matters:** A test run can create a submission, update progress, maybe create solved activity, and apply retention. Pinning best must unpin previous rows and create an activity event. Publishing a problem must update version state and current-version pointers. Direct client CRUD can leave partial state.

**Options:**

- A. Pure client CRUD for everything.
- B. RPC only for compound mutations: `record_submission`, `pin_best_submission`, `publish_problem_version`, and maybe `start_attempting`.
- C. Vercel Go functions for all compound mutations.

**Recommended:** B. Use Supabase RPC for compound database mutations and plain REST/supabase-js for simple reads and draft saves.

**Downstream impact:** This keeps "no custom backend" while giving transaction boundaries inside Postgres. The shared interface should list RPC contracts as first-class backendless APIs.

### DBQ-010: How should Storage and Postgres transaction boundaries be handled?

**Question:** When a submission code file or MDX file is uploaded to Storage, how should the app handle the fact that the subsequent Postgres write can fail?

**Why it matters:** Storage and Postgres cannot be committed in one database transaction. Orphaned files and broken database references are otherwise inevitable.

**Options:**

- A. Upload to Storage first, then call an RPC to create metadata. Cleanup orphaned files later.
- B. Insert metadata first, then upload to Storage. Mark rows incomplete until upload succeeds.
- C. Avoid Storage for user code and raw MDX in v1.
- D. Route uploads through a Vercel Go function to coordinate retries and cleanup.

**Recommended:** A. Upload first using deterministic paths, then call RPC. Track `content_hash`, object size, and path in the metadata row.

**Downstream impact:** The app needs orphan cleanup as a non-blocking maintenance task. Deterministic paths make retries idempotent when the same content is uploaded twice.

### DBQ-011: How should progress be modeled?

**Question:** Should progress use one JSONB row per user/problem, or normalized rows for per-language and per-version state?

**Why it matters:** The UI needs overall progress, language-specific solved state, previous-version solved/latest-version unsolved state, latest activity, and pinned best references.

**Options:**

- A. One `progress` table with JSONB `language_states`.
- B. Two tables: `problem_progress` for overall problem state and `language_progress` for per-language state.
- C. Derive progress entirely from submissions and attempts with views.

**Recommended:** B. Use normalized `problem_progress` and `language_progress`.

**Downstream impact:** Queries and uniqueness constraints are clearer: one row per `username_key + problem_id`, and one row per `username_key + problem_id + language`. RPC functions can update both in one transaction.

### DBQ-012: What is the exact scope of a pinned best submission?

**Question:** Is there one pinned best per username/problem/language across all versions, or one pinned best per username/problem/version/language?

**Why it matters:** The PRD says users pin one best submission per username, problem, and language, while submissions remain tied to exact problem versions. If a new version is published, an older pinned best may still exist.

**Options:**

- A. One pinned best per `username_key + problem_id + language`, regardless of version.
- B. One pinned best per `username_key + problem_id + problem_version_id + language`.
- C. Keep both: current problem-level pin plus optional version-level pin.

**Recommended:** A. Keep one problem-level pinned best per language, and always display the submission's version.

**Downstream impact:** A unique partial index can enforce one pinned row per username/problem/language. UI must label older-version pinned code clearly if the latest version differs.

### DBQ-013: How should solved status be recorded when versions change?

**Question:** Should the DB store solved version lists, latest-version status, or derive version status from submissions?

**Why it matters:** The UI must show "previous solved status" and "latest-version unsolved" when a newer problem version exists.

**Options:**

- A. Store solved state per `username_key + problem_id + language + problem_version_id` in a `solved_versions` table.
- B. Store arrays of solved version ids in `language_progress`.
- C. Derive solved versions from submissions where `solved = true`.

**Recommended:** A. Use a `solved_versions` table and update progress summary columns for fast list views.

**Downstream impact:** Historical solved state is durable even if old submission rows are archived or pruned. Problem-list status can be computed from `solved_versions` plus `problems.current_published_version_id`.

### DBQ-014: What retention policy should the database physically enforce?

**Question:** The PRD says keep latest draft, pinned best, and last 20 submissions per username/problem/language. Should old submissions be deleted, archived, or hidden?

**Why it matters:** Deleting submission rows can break activity events, pinned references, and historical solved derivation unless the schema is careful. Deleting Storage objects is a separate cleanup problem.

**Options:**

- A. Physically delete old non-pinned submission rows immediately.
- B. Mark old non-pinned submissions as `archived` or `pruned` and hide them from normal lists.
- C. Keep all submissions for the prototype and revisit after usage data.
- D. Use a scheduled cleanup job to delete DB rows and Storage objects.

**Recommended:** B. Use logical pruning in the DB first; defer physical Storage deletion.

**Downstream impact:** Retention can run inside `record_submission` RPC without risking missing code files. A later cleanup process can delete archived Storage objects when needed.

### DBQ-015: Are activity events append-only?

**Question:** Should `activity_events` be immutable append-only records, even when related submissions or problem versions are archived?

**Why it matters:** The feed is intentionally noisy and not deduplicated. Immutability makes Realtime simple, but old events may point to archived or logically pruned records.

**Options:**

- A. Append-only; never update or delete events during normal operation.
- B. Soft-delete events when related submissions are pruned.
- C. Store feed as derived data only, not a durable table.

**Recommended:** A. Make activity events append-only.

**Downstream impact:** Event payloads should include enough denormalized display data, such as problem title, version number, language, and username, so the feed still renders even if related rows are archived.

### DBQ-016: How should Realtime be split between feed updates and presence?

**Question:** Should currently-attempting state be stored in Postgres, Realtime presence, or both?

**Why it matters:** Presence is ephemeral and should expire automatically. Activity feed events are durable and should be queryable after reload.

**Options:**

- A. Use Postgres Changes on `activity_events` for feed updates, and Supabase Realtime Presence channels for currently-attempting state.
- B. Store presence in a durable `presence` table and update it on heartbeat.
- C. Use only activity events; no live presence.

**Recommended:** A. Durable feed in Postgres, ephemeral currently-attempting state through Realtime Presence.

**Downstream impact:** Presence channels can be named by problem/version, for example `problem:{problem_id}:{problem_version_id}`. The database does not need a `presence` table in v1.

### DBQ-017: What Storage buckets and policies should exist?

**Question:** Should buckets be private with broad authenticated read/write policies, or public buckets with obscured paths?

**Why it matters:** Raw MDX and submitted code are visible to logged-in users, but drafts should not be listed publicly in the UI. With weak username identity, draft privacy cannot be strongly enforced.

**Options:**

- A. Private buckets with authenticated read/write policies and path conventions.
- B. Public buckets for MDX and submission code; private/authenticated bucket for drafts.
- C. Public buckets for everything.
- D. No Storage for code, only MDX.

**Recommended:** A. Use private buckets and allow authenticated users broad access according to prototype rules.

**Downstream impact:** This avoids truly public object URLs. It still does not provide strong ownership for drafts. If anonymous auth is not used from DBQ-001, policies must instead allow `anon`, weakening the boundary further.

### DBQ-018: How should direct users fetch submitted code?

**Question:** Since all submissions are visible, should submission code be downloaded directly from Storage by path, or should a signed URL/RPC/function be used?

**Why it matters:** Direct Storage reads are simpler, but signed URLs add overhead. The app does not need strong submission privacy in v1.

**Options:**

- A. Direct Storage download by `code_storage_path` for authenticated users.
- B. Generate signed URLs client-side through Supabase Storage API.
- C. Use a Vercel Go function to proxy code reads.

**Recommended:** A. Direct Storage download by path.

**Downstream impact:** The submission detail page needs Storage read access and syntax highlighting. There is no need for a code-read backend in v1.

### DBQ-019: Where should detailed test results live?

**Question:** Should each submission store all per-test result details in Postgres JSONB, or store details separately in Storage?

**Why it matters:** Per-test outputs can become large. The shared interface includes `RunResult.cases`; the UI needs details for result display and submission browsing.

**Options:**

- A. Store summary columns plus bounded `result jsonb` in `submissions`.
- B. Store only summary columns in `submissions` and put full result JSON in Storage.
- C. Use a separate `submission_test_results` table with one row per case.

**Recommended:** A. Store bounded result JSONB in Postgres.

**Downstream impact:** Enforce output truncation before persistence using `limits.outputBytes`. Index summary columns only; do not index full result JSONB unless a real query requires it.

### DBQ-020: Which write operations need triggers?

**Question:** Should database triggers create progress/activity side effects, or should RPC functions do that explicitly?

**Why it matters:** Triggers can make direct table inserts convenient but harder to reason about. RPC functions make side effects explicit and transactional.

**Options:**

- A. Use triggers on `submissions`, `problem_versions`, and pinned-best updates.
- B. Avoid triggers for business logic; use RPC functions that perform all writes explicitly.
- C. Use no triggers or RPC; make the UI issue every write.

**Recommended:** B. Prefer explicit RPC functions over hidden business-logic triggers.

**Downstream impact:** Schema remains easier for junior developers and AI agents to understand. Triggers may still be useful for timestamps such as `updated_at`, but not for core product transitions.

### DBQ-021: What indexes are required for v1 queries?

**Question:** Which query surfaces must be optimized from the start?

**Why it matters:** The app will query problem lists, user progress, per-problem submissions, all-user feeds, and version state. Missing indexes will make even a prototype feel slow once submissions grow.

**Options:**

- A. Add only primary keys and let performance issues emerge.
- B. Add focused composite indexes for known query surfaces.
- C. Over-index every foreign key and JSON field.

**Recommended:** B. Add focused composite indexes.

**Downstream impact:** Likely indexes include:

- `problem_versions(problem_id, status, version_number desc)`.
- `problems(current_published_version_id)`.
- `attempts(username_key, problem_version_id, language)` unique.
- `submissions(username_key, problem_id, language, created_at desc)`.
- `submissions(problem_id, problem_version_id, created_at desc)`.
- Unique partial pinned-best index on `submissions(username_key, problem_id, language) where pinned_best`.
- `problem_progress(username_key, problem_id)` unique.
- `language_progress(username_key, problem_id, language)` unique.
- `activity_events(created_at desc)`.

### DBQ-022: How much denormalized data should activity events store?

**Question:** Should activity events store only foreign keys, or include denormalized display fields?

**Why it matters:** Feed rendering can become fragile if problem titles, version rows, or submission rows are archived. Realtime feed UI benefits from not doing several joins per event.

**Options:**

- A. Store only ids and join everything at read time.
- B. Store ids plus denormalized snapshot fields needed for feed display.
- C. Store a fully rendered message string only.

**Recommended:** B. Store ids plus display snapshots.

**Downstream impact:** `activity_events` can include `problem_title`, `problem_version_number`, `language`, and maybe `submission_solved`. The UI can render feed items quickly while still linking to canonical records.

### DBQ-023: What is the migration and type-generation workflow?

**Question:** Should the DB architecture assume Supabase CLI migrations and generated TypeScript types?

**Why it matters:** Vite UI and Supabase REST calls need stable table/enum names. Without migrations, schema drift will make shared interfaces unreliable.

**Options:**

- A. Use Supabase dashboard/manual SQL only.
- B. Use Supabase CLI migrations committed to the repo and generate TypeScript database types.
- C. Use an ORM migration tool.

**Recommended:** B. Use Supabase CLI migrations and generated TypeScript DB types.

**Downstream impact:** This supports direct Supabase usage from the UI without a backend. Generated DB types can be compared against `shared-interfaces.md` during implementation.

### DBQ-024: When is a Vercel Go backend actually required?

**Question:** Which DB/Supabase operations are impossible or too brittle with direct Supabase plus RPC?

**Why it matters:** The user prefers no backend unless required. Naming the trigger points prevents accidental backend creep.

**Options:**

- A. No Go functions in v1; use Supabase Postgres, Storage, Realtime, and RPC only.
- B. Add Go only for MDX validation/publishing.
- C. Add Go only for scheduled cleanup of Storage orphans/archived objects.
- D. Add Go for all writes to hide Supabase details from the browser.

**Recommended:** A for the initial plan, with C as the first acceptable exception if physical Storage cleanup becomes necessary.

**Downstream impact:** Final architecture should not include Go functions unless a specific unresolved risk remains. Supabase RPC is still compatible with the "no custom backend" preference.

## Blocking Decisions

These decisions should be resolved before the final DB/Supabase architecture plan:

- DBQ-001: Supabase anonymous auth vs fully permissive anon access.
- DBQ-004: Whether drafts live in Postgres or Storage.
- DBQ-005: Raw MDX Storage vs Postgres.
- DBQ-006: How official repo-backed problems are seeded/represented in Supabase.
- DBQ-007: Single `problem_versions` table with statuses vs separate upload/version tables.
- DBQ-008: Publish validation boundary.
- DBQ-009: Whether compound writes use Supabase RPC.
- DBQ-011: Progress schema shape.
- DBQ-012: Pinned best uniqueness scope.
- DBQ-013: Solved-version persistence.
- DBQ-014: Logical vs physical retention cleanup.
- DBQ-017: Storage bucket privacy and policies.

## Non-blocking Decisions

These can be decided during final planning or early implementation without changing the product shape:

- DBQ-003: Whether profile upsert gets its own RPC after DB constraints exist.
- DBQ-010: Exact orphan cleanup timing, as long as upload-first/idempotent paths are chosen.
- DBQ-015: Whether old activity events are ever archived.
- DBQ-016: Exact Realtime channel naming.
- DBQ-018: Direct download vs signed URLs for submitted code.
- DBQ-019: Exact persisted result JSON size limits.
- DBQ-020: Trigger usage for timestamps.
- DBQ-021: Final index list.
- DBQ-022: Exact denormalized activity event fields.
- DBQ-023: Type-generation command placement.
- DBQ-024: Whether Storage cleanup eventually justifies a Vercel Go function.
