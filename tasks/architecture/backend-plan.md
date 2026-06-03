# Backend And Vercel Go Design

Status: accepted v1 design.

This plan uses the recommended answers from `backend-open-questions.md`: no custom backend for v1, Supabase RPC for database-local transactions, and Vercel Go functions only as future escape hatches.

## Purpose

The v1 prototype should avoid a custom backend. The Vite app talks directly to Supabase for database, Storage, Realtime, Presence, and anonymous auth. Supabase Postgres RPC functions provide transaction boundaries for compound writes.

Vercel hosts the Vite frontend. Vercel Go functions are not part of v1 unless an implementation spike proves that a specific operation cannot be handled with Supabase APIs and RPC.

## Accepted Decisions

- No custom backend in v1.
- No server-side code judging in v1.
- No server-side MDX rendering in v1.
- No signed upload URLs in v1.
- No app-level Go rate limiting in v1.
- Use Supabase RPC for publish, commit submission, pin best, and version switch transactions.
- Browser uploads MDX and submitted code directly to Supabase Storage.
- Browser runner results are accepted as local learning signals.
- Add Go only for secrets, signed upload URLs, physical cleanup, external services, or cross-service orchestration that Supabase cannot handle cleanly.

## Runtime Boundary

### V1 Runtime

```txt
Browser Vite App
  -> Supabase Auth anonymous sign-in
  -> Supabase PostgREST/table reads
  -> Supabase RPC for compound writes
  -> Supabase Storage for MDX and submitted code
  -> Supabase Realtime for feed and presence
```

### Not In V1

```txt
Browser -> Vercel Go -> Supabase
Browser -> Go code runner
Browser -> Go MDX compiler
Browser -> Go signed upload service
```

## Transaction Strategy Without Go

Use Supabase RPC for database-local transactions.

RPC functions:

- `upsert_profile`
- `publish_problem_version`
- `commit_submission`
- `pin_best_submission`
- `switch_problem_version`

The browser can still do simple direct operations:

- Read lists and detail metadata.
- Save drafts.
- Upload files to Storage.
- Download files from Storage.
- Insert `started_attempting` activity events.

## Storage Transaction Strategy

Storage and Postgres do not share one transaction. Use upload-first workflows.

### Publish Problem

1. Browser validates MDX frontmatter.
2. Browser uploads raw MDX to `problem-mdx`.
3. Browser writes/updates draft metadata.
4. Browser calls `publish_problem_version`.
5. RPC validates structured metadata and publishes atomically.

If RPC fails after upload, the MDX object may be orphaned. This is acceptable in v1 and can be cleaned later.

### Commit Submission

1. Browser runs visible tests.
2. Browser uploads immutable code snapshot to `submission-code`.
3. Browser calls `commit_submission`.
4. RPC inserts metadata, progress, solved state, activity, and retention changes.

If RPC fails after upload, the code object may be orphaned. This is acceptable in v1.

## Vercel Deployment

Vercel hosts the Vite app as a frontend deployment.

Expected project commands:

```txt
yarn install
yarn build
```

Expected output:

```txt
dist/
```

Browser-visible environment variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY
```

Server-only environment variables are not needed in v1:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

If a future Go function is added, service-role keys must exist only as Vercel server-side environment variables.

## Future Go Function Triggers

Add Go only when one of these becomes true:

- A workflow needs a secret that cannot be exposed to the browser.
- Storage policies need signed upload URLs.
- Physical Storage cleanup needs to run on a schedule.
- An external service integration is introduced.
- Request-level rate limiting becomes necessary.
- Cross-service orchestration cannot be done safely with upload-first plus RPC.
- Server-side MDX metadata validation becomes necessary and cannot be expressed with parsed JSON plus RPC checks.

Do not add Go simply because validation is complex. Prefer shared TypeScript validation in the UI plus Postgres constraints/RPC for invariants.

## Candidate Future Endpoints

These are not v1 endpoints.

```txt
POST /api/create-signed-upload
POST /api/cleanup-submissions
POST /api/validate-mdx
POST /api/publish-problem
```

### `POST /api/create-signed-upload`

Use only if direct Storage policies become too broad.

Responsibilities:

- Validate requested bucket and path.
- Use service-role key server-side.
- Return signed upload URL/token.
- Never accept arbitrary bucket names from the browser.

### `POST /api/cleanup-submissions`

Use only if archived Storage objects need physical deletion.

Responsibilities:

- Find archived submissions past a retention age.
- Delete Storage objects.
- Mark cleanup status.
- Support idempotent retries.

### `POST /api/validate-mdx`

Use only if browser-side validation and database-side metadata checks are insufficient.

Responsibilities:

- Validate frontmatter and parsed schema.
- Do not execute or render MDX.
- Return field-specific errors.

### `POST /api/publish-problem`

Use only if publishing must coordinate signed uploads, server-side validation, and database RPC in one server-managed flow.

Responsibilities:

- Validate request envelope.
- Call existing Supabase RPC.
- Avoid duplicating publish transaction logic in Go.

## Go Layout If Added Later

Vercel currently supports Go functions from `.go` files inside `/api`, where each file exports an HTTP handler function, and also supports Go server deployments through the Go framework preset. If this project adds small endpoint-style functions, use `/api/*.go`.

Recommended future layout:

```txt
api/
  create-signed-upload.go
  cleanup-submissions.go
  validate-mdx.go
  publish-problem.go
internal/
  cors/
  supabase/
  response/
go.mod
go.sum
```

Rules:

- One Go file per endpoint.
- Shared helpers for CORS, JSON responses, and Supabase HTTP calls.
- Functions call Supabase RPC/REST rather than connect directly to Postgres.
- Keep database transaction logic in Postgres RPC.

## CORS If Go Is Added

No custom CORS is needed while there are no Go functions.

If Go functions are added:

- Allow configured production Vercel domain.
- Allow configured preview domains if needed.
- Allow `localhost` origins in development.
- Do not use wildcard CORS for credentialed endpoints.
- Centralize CORS logic in a helper.

## Rate Limiting

No Go rate limiting in v1.

V1 guardrails:

- Database check constraints.
- Storage bucket file-size limits where practical.
- UI-side max MDX size.
- UI-side max code size.
- Runner output caps.

Add backend rate limiting only if internal usage creates real abuse or runaway costs.

## MDX Validation Boundary

V1:

- Browser validates frontmatter for user feedback.
- Supabase RPC validates structured metadata before publish.
- UI renders full MDX in the main React tree by explicit prototype decision.
- Go does not parse, compile, render, or execute MDX.

Future:

- Go may validate structured metadata if direct browser parsing proves unreliable.
- Go should not execute uploaded MDX.

## Code Execution Boundary

V1:

- JavaScript and PHP run in browser workers.
- Submitted results are accepted as local learning results.
- No Go function executes user code.
- No server-side judging or leaderboard verification.

Future:

- If trusted scoring is needed, design a separate server-side judging system. Do not bolt it onto these lightweight Vercel functions.

## Service Role Key Rules

- Never expose service-role keys in Vite.
- Do not prefix service secrets with `VITE_`.
- If Go is added, service-role keys may be used only server-side.
- Prefer RPC functions callable by authenticated users before introducing service-role Go calls.

## Local Development

V1:

- Vite app can talk to a hosted Supabase project.
- Supabase schema changes are managed through CLI migrations.
- No Vercel dev requirement until Go functions exist.

Future:

- Add Supabase local development after migrations stabilize.
- Add Vercel dev only when `/api` functions exist.

## Deployment Headers

Do not add global cross-origin isolation headers in v1 unless the selected PHP runtime requires them.

Future rules:

- Add route-specific headers for runner pages only if a runtime requires them.
- Avoid global headers until tested against Supabase Auth, Storage, Realtime, and Vercel previews.
- WebContainers/real Node support is future scope and may require additional headers.

## Operational Runbook

V1 setup:

1. Create Supabase project.
2. Enable anonymous sign-ins.
3. Apply Supabase migrations.
4. Create private Storage buckets.
5. Configure Storage policies.
6. Configure Realtime for `activity_events`.
7. Seed official problems.
8. Set Vercel browser environment variables.
9. Deploy Vite app.

No backend service deployment is required.

## Risks

- Direct Supabase access exposes the database API shape to browser users.
- Anonymous auth is not real identity.
- Upload-first workflows can create orphaned Storage objects.
- Full MDX rendering in the main React tree is unsafe for untrusted public use.
- Browser-reported submissions can be falsified.
- Lack of rate limiting is acceptable only for the internal prototype.

## Future Escalation Path

Escalate in this order:

1. Add more database constraints and RPC validation.
2. Add Supabase scheduled cleanup or SQL maintenance jobs if available and sufficient.
3. Add a narrow Vercel Go function for signed uploads or physical cleanup.
4. Add broader backend only if product requirements change toward trusted public use.

## References

- Vercel Go runtime: https://vercel.com/docs/functions/runtimes/go
- Supabase JavaScript RPC: https://supabase.com/docs/reference/javascript/rpc
- Supabase Storage quickstart: https://supabase.com/docs/guides/storage/quickstart
- Supabase private Storage downloads: https://supabase.com/docs/guides/storage/serving/downloads
