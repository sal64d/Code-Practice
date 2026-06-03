# Backend/Vercel-Go Open Questions

Status: draft for review. This is not the final backend architecture plan.

Inputs read:

- `tasks/prd-logical-programming-learning-app.md`
- `tasks/architecture/shared-interfaces.md`

## Scope

This file covers backend architecture questions for an internal prototype learning app using Vite on Vercel, Supabase Database/Storage/Realtime, and optional Vercel Go serverless functions.

The main decision is whether the app needs a custom backend at all. The current shared interface recommends direct Supabase access from the Vite client for v1, with Vercel Go functions introduced only for operations that need secrets, cross-service orchestration, transactional guarantees that Supabase RPC cannot express cleanly, signed upload flows, cleanup jobs, or stronger request validation.

This file intentionally asks backend-specific questions only. It does not define the final UI, database schema, or implementation plan.

## Open Questions

### BQ-001: Should v1 eliminate a custom backend entirely?

**Why it matters:** A backend adds operational surface area, deployment complexity, and duplicate validation risk. Avoiding it keeps the prototype fast, but direct client-to-Supabase writes mean the browser owns more workflow logic.

**Options:**

- A. No custom backend in v1. The Vite app uses Supabase REST/Storage/Realtime directly, with database constraints and optional Supabase RPC for multi-step writes.
- B. Use Go serverless functions for all writes, so the client reads directly but writes through `/api`.
- C. Hybrid: direct Supabase for simple reads/writes, Go functions only for publish, signed uploads, and cleanup.

**Recommended:** A for the first prototype, with C as the escalation path. Do not introduce Go until a specific operation cannot be handled safely or simply with direct Supabase plus Postgres RPC.

**Downstream impact:** UI can move faster with `supabase-js` or REST calls. DB design must carry more validation through constraints, RLS/permissive policies, triggers, and RPC. Backend plan stays small unless later decisions require Go.

### BQ-002: What is the exact threshold for adding a Go function?

**Why it matters:** Without a threshold, the project can drift into a half-backend where some business rules live in the UI, some in Go, and some in Postgres.

**Options:**

- A. Add Go only when the operation requires a secret, signed URL generation, multi-service orchestration, scheduled cleanup, or request-level throttling that Supabase cannot provide well.
- B. Add Go whenever validation is complex.
- C. Add Go for every operation that modifies more than one table.

**Recommended:** A. Prefer Supabase constraints/RPC for database-local logic. Use Go only for secrets, Storage orchestration, external services, scheduled jobs, or edge cases that are awkward in Postgres.

**Downstream impact:** Keeps backend ownership narrow. Publish and submission flows should first be designed as Supabase RPC candidates before becoming Go endpoints.

### BQ-003: Should Supabase RPC be preferred over Vercel Go for transactional database workflows?

**Why it matters:** Publishing a problem, creating a submission, updating progress, applying retention, and inserting activity events are multi-step operations. If implemented from the client as separate REST calls, partial failure can leave inconsistent state.

**Options:**

- A. Prefer Supabase Postgres functions/RPC for database-only transactions.
- B. Prefer Go functions for all transactions, using the Supabase service role key.
- C. Allow the client to perform multi-step transactions manually.

**Recommended:** A. Use Postgres RPC for database-local transactions because it keeps the transaction inside the database and avoids service role exposure outside Supabase.

**Downstream impact:** DB plan must define RPC functions for publish, submission persistence, pinning best submissions, and retention if these need atomic behavior. Go remains optional for cross-service work.

### BQ-004: Can MDX validation run only in the browser?

**Why it matters:** Any logged-in user can upload and publish full MDX visible to all logged-in users. Browser-only validation is easiest, but users can bypass it and write directly to Supabase if policies permit.

**Options:**

- A. Browser validates MDX before saving or publishing; database stores validation status but trusts client input.
- B. Browser validates for fast feedback, but publish must call Supabase RPC that re-validates required metadata fields already stored in parsed JSON.
- C. Publish must call a Go `/api/validate-mdx` or `/api/publish-problem` endpoint that parses and validates the MDX server-side.

**Recommended:** B for v1. Full MDX rendering remains a prototype risk, but schema-critical metadata should be validated again at publish through database constraints/RPC against parsed JSON fields.

**Downstream impact:** UI still needs local validation for author experience. DB must store parsed metadata in structured columns/JSON and reject missing or malformed publish data. Go validation can wait unless MDX parsing cannot be made consistent in the browser.

### BQ-005: Should publishing a problem be one atomic operation?

**Why it matters:** Publishing must create or update `problems`, create a `problem_versions` row, store or reference MDX content, set current version, and insert an activity event. Partial writes can create broken problem list entries or missing version history.

**Options:**

- A. Yes, publishing is a single Supabase RPC transaction after MDX is uploaded and parsed metadata is ready.
- B. Yes, publishing is a single Go function that orchestrates Storage and database writes.
- C. No, the client performs each step and retries failures.

**Recommended:** A if the MDX file is already uploaded before publish. Use Go only if publish must also create signed upload URLs or perform server-side MDX parsing in the same operation.

**Downstream impact:** DB plan must include a publish RPC. UI should treat publish as one action with one success/failure result. Backend Go is not required unless Storage signing or parsing moves server-side.

### BQ-006: How should uploaded MDX Storage paths be authorized?

**Why it matters:** The PRD allows any logged-in prototype user to publish full MDX, but there is no real auth. Storage rules need to match the weak username identity model without pretending to be secure.

**Options:**

- A. Client uploads directly to Supabase Storage using the anon key and permissive bucket policies.
- B. Client requests a signed upload URL from a Go function.
- C. Client stores MDX content only in Postgres, not Storage.

**Recommended:** A for prototype simplicity, if buckets are explicitly documented as weakly protected. Revisit B before sharing beyond trusted internal users.

**Downstream impact:** No Go function is needed for uploads. Storage policies must allow prototype writes and reads. The DB should store `mdxStoragePath` and parsed metadata so the app does not need to parse every file for list views.

### BQ-007: Should submission code and draft code be stored in Supabase Storage or database rows?

**Why it matters:** The user prefers Storage for MDX and user code. Storage keeps large code blobs out of rows, but creates multi-step writes and cleanup complexity.

**Options:**

- A. Store code blobs in Supabase Storage and metadata/results in Postgres.
- B. Store code text directly in Postgres for drafts and submissions.
- C. Store drafts in Postgres for easy autosave and immutable submissions in Storage.

**Recommended:** A to match the requested architecture and shared interfaces. Add database metadata that is sufficient for listing and retention without downloading code blobs.

**Downstream impact:** Submission creation must upload code first, then insert metadata. Cleanup must delete old Storage objects or archive rows carefully. UI needs download/read paths for submission browsing.

### BQ-008: Are signed upload URLs necessary for code and MDX?

**Why it matters:** Signed URLs let the app keep bucket permissions tighter and centralize upload path validation, but require a backend or Supabase Edge Function/service-role flow.

**Options:**

- A. Not in v1. Direct Supabase Storage uploads are acceptable for the internal prototype.
- B. Use Vercel Go `/api/create-signed-upload` for all Storage writes.
- C. Use signed URLs only for immutable submission code, not drafts or MDX.

**Recommended:** A. Add signed URLs only when bucket policies become a real concern or upload path abuse becomes painful.

**Downstream impact:** No service role key is needed in Vercel for v1 uploads. Storage path generation must be deterministic and validated in the UI and DB metadata.

### BQ-009: Can the service role key ever be exposed to the browser?

**Why it matters:** The service role key bypasses Supabase RLS and must never be sent to the client, even in an internal prototype.

**Options:**

- A. Never expose the service role key to the Vite app. Only anon/public keys are browser-visible.
- B. Expose service role in the browser because it is internal-only.
- C. Avoid service role everywhere, including Go functions.

**Recommended:** A. If a Go function is introduced, it may use the service role key as a server-only environment variable. The browser must only use anon/public Supabase credentials.

**Downstream impact:** Any privileged operation requiring service role must become Supabase RPC with controlled permissions or a server-only Go function. Vercel environment variable setup must distinguish public and private variables.

### BQ-010: How should retention cleanup for submissions be triggered?

**Why it matters:** The PRD keeps the latest draft, pinned best, and last 20 submissions per username/problem/language. Browser-triggered cleanup can be missed, duplicated, or interrupted.

**Options:**

- A. Apply retention synchronously inside a `create_submission` Supabase RPC transaction.
- B. Let the client insert submissions and run cleanup opportunistically after each run.
- C. Use a scheduled Vercel Go function or Supabase scheduled job to clean old records and Storage blobs.

**Recommended:** A for metadata consistency, plus C later if Storage object cleanup becomes necessary. The RPC can mark old submissions archived/deleted; a periodic job can remove orphaned Storage blobs.

**Downstream impact:** DB plan needs retention logic near submission creation. Backend may eventually need `/api/cleanup-submissions` or a Supabase scheduled function for Storage garbage collection.

### BQ-011: Should started-attempting activity events go through a backend?

**Why it matters:** The PRD intentionally stores every opened problem/editor event and does not deduplicate. A backend could rate-limit noise, but that conflicts with the current prototype decision.

**Options:**

- A. Insert activity events directly from the client.
- B. Use a Go endpoint to insert activity events with rate limiting.
- C. Use a Supabase RPC to insert activity events and enforce minimal validation.

**Recommended:** A for v1, because no deduplication is required. Move to C if activity payload validation gets messy.

**Downstream impact:** Feed can be noisy as expected. DB must accept event inserts from logged-in prototype clients. Go is not needed for activity.

### BQ-012: How should CORS be handled if Go functions are added?

**Why it matters:** Vite and Vercel deployments may use preview domains, production domains, and local development origins. CORS mistakes can block uploads/publishing or accidentally allow too broad access.

**Options:**

- A. No custom CORS work in v1 because there are no Go functions.
- B. If Go functions are added, allow only configured origins from environment variables plus localhost in development.
- C. Use `Access-Control-Allow-Origin: *` for simplicity.

**Recommended:** B once Go exists. Until then, rely on Supabase client configuration and avoid custom CORS handling.

**Downstream impact:** Backend plan must include shared CORS middleware/helper if any `/api` functions are introduced. Vercel preview URLs need an explicit policy.

### BQ-013: Is rate limiting required in v1?

**Why it matters:** Username-only login, open publishing, visible submissions, and direct writes can be abused by anyone with the URL. Rate limiting can reduce accidents and spam but needs a backend, Supabase limits, or database-side throttling.

**Options:**

- A. No app-level rate limiting in v1; rely on internal usage and Supabase/Vercel platform limits.
- B. Add database-side guardrails for expensive writes, such as max upload size and max metadata size.
- C. Add Go endpoints specifically to rate-limit upload, publish, and submission creation.

**Recommended:** B. Avoid custom backend rate limiting for the prototype, but enforce size limits and basic constraints wherever possible.

**Downstream impact:** DB and Storage plans must define size and shape limits. If usage becomes noisy, Go endpoints or Supabase Edge Functions can later front the expensive writes.

### BQ-014: What should the Go serverless layout be if backend functions become necessary?

**Why it matters:** Vercel supports Go serverless functions under `/api`. A consistent layout avoids endpoint sprawl and duplicated helpers.

**Options:**

- A. Use one Go file per endpoint under `/api`, with shared helper packages for CORS, Supabase, request parsing, and responses.
- B. Use a single catch-all Go handler that routes all backend actions internally.
- C. Use another backend framework outside Vercel functions.

**Recommended:** A. Keep functions small and map each endpoint to a clear contract, such as `/api/publish-problem` or `/api/create-signed-upload`.

**Downstream impact:** If Go is introduced, repo layout should reserve `/api/*.go` and a small shared package if Vercel supports it cleanly in the chosen setup. Endpoint contracts must stay aligned with `shared-interfaces.md`.

### BQ-015: Should Go functions use Supabase REST, direct Postgres, or Supabase client libraries?

**Why it matters:** The backend may need database writes with service-role privileges. The integration choice affects deployment dependencies, error handling, and transaction strategy.

**Options:**

- A. Go functions call Supabase PostgREST/RPC endpoints over HTTP using anon/service role keys as appropriate.
- B. Go functions connect directly to Postgres.
- C. Go functions call only Storage APIs; database transactions stay in Supabase RPC.

**Recommended:** A if Go needs database access, but prefer calling existing RPC functions rather than reimplementing transaction logic in Go.

**Downstream impact:** Backend code remains thin. DB remains the source of transactional truth. Direct Postgres connections are avoided unless RPC/REST proves inadequate.

### BQ-016: How should backend and database validation be split?

**Why it matters:** Problem schema validation, storage path validation, submission result validation, and progress updates can be duplicated across UI, DB, and Go. Duplicated rules diverge quickly.

**Options:**

- A. UI performs user-friendly validation; DB/RPC enforces required invariants; Go only validates request envelope and secrets-bound inputs.
- B. UI and Go both fully validate everything.
- C. Trust UI validation for prototype speed.

**Recommended:** A. The UI can explain errors, but database constraints/RPC must protect core invariants such as valid language, version existence, visible test counts, solved status, and pinned-best uniqueness.

**Downstream impact:** Shared interface types should be reused by UI. DB plan must define constraints and RPC checks. Backend, if added, should not become a second full domain model.

### BQ-017: Should browser runner results be accepted without server verification?

**Why it matters:** The PRD says browser results are personal learning signals, not trusted achievements. A backend could verify submissions, but that would contradict v1 non-goals and introduce code execution infrastructure.

**Options:**

- A. Accept browser-produced results and label them as local learning results.
- B. Use Go functions to verify results server-side without executing arbitrary code.
- C. Add server-side code execution for trusted judging.

**Recommended:** A. Do not add backend judging in v1.

**Downstream impact:** Backend has no runner responsibility. Submission records store client-reported result details. UI copy must avoid trusted competitive claims.

### BQ-018: Should Vercel Go functions ever parse or execute user MDX?

**Why it matters:** Full MDX can execute code depending on the renderer. Parsing or rendering untrusted MDX server-side can create server security problems.

**Options:**

- A. Go functions do not render MDX. They may validate structured metadata only if needed.
- B. Go functions parse full MDX for validation but never render it.
- C. Go functions compile/render MDX to HTML.

**Recommended:** A. Keep MDX rendering in the UI prototype path. If server-side validation is later required, validate structured frontmatter and parsed JSON rather than executing MDX.

**Downstream impact:** Go backend avoids MDX runtime dependencies. UI/domain logic must own MDX rendering risk. DB stores structured metadata for list views and publish checks.

### BQ-019: How should local development handle Supabase and optional Go functions?

**Why it matters:** The app is a prototype, but developers need a repeatable setup for Vite, Supabase credentials, and any Vercel-style `/api` functions.

**Options:**

- A. Local Vite app talks to a hosted Supabase project; Go functions are absent unless needed.
- B. Use Supabase local development from day one.
- C. Require Vercel dev for all local work so `/api` functions and Vite run together.

**Recommended:** A for the first prototype. Add Supabase local dev and Vercel dev once schema migrations and Go endpoints exist.

**Downstream impact:** Backend plan can initially be documentation-only. DB plan must make migrations reproducible even if the runtime project is hosted.

### BQ-020: What deployment constraints should be reserved now for future runtimes?

**Why it matters:** The PRD currently avoids real Node/WebContainers, but future browser runtimes may need cross-origin isolation headers. PHP WASM may also impose asset hosting requirements.

**Options:**

- A. Do not add special headers until a selected runtime requires them.
- B. Add cross-origin isolation headers globally now.
- C. Add headers only on runner routes once runtime requirements are known.

**Recommended:** C if a runtime requires it; otherwise A. Avoid global headers until tested because they can affect third-party scripts, Supabase auth/storage behavior, and previews.

**Downstream impact:** Backend may need no role here, but Vercel configuration may need route-specific headers. UI runner selection should surface any required hosting headers before implementation.

## Blocking decisions

- Whether v1 truly has no custom backend, or whether publish/submission flows require Go from the start.
- Whether database-only transactions through Supabase RPC are acceptable for publish, submission creation, pinning best submissions, and retention.
- Whether direct Supabase Storage uploads are acceptable for MDX, drafts, and submission code without signed URLs.
- Whether browser-only MDX validation is sufficient, or publish requires server-side/database-side validation.
- Whether retention cleanup must delete Storage objects immediately, or metadata retention can ship first with later blob cleanup.

## Non-blocking decisions

- Exact Go `/api` file layout, as long as no Go backend exists yet.
- Exact CORS policy for Go functions, provided functions are not part of v1.
- Whether Supabase local development is required immediately or after migrations stabilize.
- Whether future runtime headers are global or route-specific, until the JavaScript/PHP runner implementations are selected.
- Whether rate limiting is implemented in Go later, as long as v1 has database/storage size constraints and clear prototype expectations.
