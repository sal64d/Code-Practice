# Supabase (learn-app)

Database migrations and local Supabase CLI configuration for the logical programming learning app.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`brew install supabase/tap/supabase` or see docs)
- A hosted Supabase project for development (or use `supabase start` for local Postgres)

Do **not** commit access tokens, service-role keys, or database passwords.

## Link this repo to your hosted project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

`project-ref` is the subdomain of your project URL (`https://<project-ref>.supabase.co`).

## Apply migrations

Against the linked remote project:

```bash
supabase db push
```

Local stack (optional):

```bash
supabase start
supabase db reset   # applies all migrations
```

## Anonymous auth (required for US-004 / login)

The UI signs in with [anonymous auth](https://supabase.com/docs/guides/auth/auth-anonymous) after the username gate.

1. Open Supabase Dashboard → **Authentication** → **Providers**.
2. Enable **Anonymous sign-ins** (or confirm `enable_anonymous_sign_ins = true` in `config.toml` for local CLI).
3. RLS policies in migrations require `authenticated` role; users without a session cannot read app data through normal policies.

Prototype note: anonymous sessions are only a transport gate. App identity is `profiles.username_key`, which is not cryptographically secure.

## Generate TypeScript types (US-006)

From the repo root after linking (or with local stack running):

```bash
cd app/ui
yarn supabase:types
```

Writes `app/ui/src/types/supabase.ts`. Re-run after every schema migration.

## Environment variables (UI)

Copy `app/ui/.env.example` to `app/ui/.env.local`:

```txt
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in Vite env files. Use it only for CLI, seeds, or server-side scripts.

## Storage buckets

Migrations create private buckets:

- `problem-mdx` — raw problem MDX
- `submission-code` — immutable submission snapshots

Authenticated users can read and upload per prototype policies. Buckets are not public.

## RPC functions

Compound writes use Postgres RPC (see `tasks/architecture/db-plan.md`):

- `upsert_profile`
- `publish_problem_version`
- `commit_submission`
- `pin_best_submission`
- `switch_problem_version`
