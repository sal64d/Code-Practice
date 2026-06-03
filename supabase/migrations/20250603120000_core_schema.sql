-- Core enums, tables, indexes (US-002)

create extension if not exists pgcrypto;

create type public.language as enum ('javascript', 'php');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.problem_source_type as enum ('official_repo', 'user_upload');
create type public.problem_version_status as enum ('draft', 'published', 'archived');
create type public.activity_event_type as enum (
  'started_attempting',
  'submitted_attempt',
  'solved_problem',
  'published_problem',
  'pinned_best_submission'
);

create table public.profiles (
  username_key text primary key,
  display_username text not null,
  last_auth_user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_key_format check (username_key ~ '^[a-z0-9_-]{1,40}$')
);

create table public.problems (
  id text primary key,
  source_type public.problem_source_type not null,
  title text not null,
  difficulty public.difficulty not null,
  tags text[] not null default '{}',
  supported_languages public.language[] not null,
  current_published_version_id uuid null,
  created_by_username_key text references public.profiles (username_key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.problem_versions (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references public.problems (id) on delete cascade,
  version_number integer null,
  status public.problem_version_status not null default 'draft',
  title text not null,
  difficulty public.difficulty not null,
  tags text[] not null default '{}',
  supported_languages public.language[] not null,
  visible_test_count integer not null,
  parsed_frontmatter jsonb not null,
  mdx_storage_path text not null,
  content_hash text not null,
  created_by_username_key text references public.profiles (username_key),
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (problem_id, content_hash),
  constraint problem_versions_visible_test_count_positive check (visible_test_count > 0)
);

alter table public.problems
  add constraint problems_current_published_version_id_fkey
  foreign key (current_published_version_id)
  references public.problem_versions (id);

create unique index problem_versions_unique_number
  on public.problem_versions (problem_id, version_number)
  where version_number is not null;

create table public.attempts (
  username_key text not null references public.profiles (username_key) on delete cascade,
  problem_id text not null references public.problems (id) on delete cascade,
  problem_version_id uuid not null references public.problem_versions (id) on delete cascade,
  language public.language not null,
  code_text text not null,
  updated_at timestamptz not null default now(),
  primary key (username_key, problem_version_id, language)
);

create table public.submissions (
  id uuid primary key,
  username_key text not null references public.profiles (username_key) on delete cascade,
  problem_id text not null references public.problems (id) on delete cascade,
  problem_version_id uuid not null references public.problem_versions (id) on delete cascade,
  language public.language not null,
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
  constraint submissions_passed_non_negative check (passed >= 0),
  constraint submissions_total_positive check (total > 0),
  constraint submissions_passed_lte_total check (passed <= total)
);

create unique index submissions_one_pinned_best
  on public.submissions (username_key, problem_id, language)
  where pinned_best;

create table public.problem_progress (
  username_key text not null references public.profiles (username_key) on delete cascade,
  problem_id text not null references public.problems (id) on delete cascade,
  started_problem_version_id uuid not null references public.problem_versions (id),
  latest_attempted_problem_version_id uuid not null references public.problem_versions (id),
  overall_state text not null,
  pinned_best_submission_id uuid references public.submissions (id),
  last_activity_at timestamptz not null default now(),
  primary key (username_key, problem_id),
  constraint problem_progress_overall_state_valid check (
    overall_state in (
      'unattempted',
      'attempted',
      'solved_current_version',
      'solved_previous_version_latest_unsolved'
    )
  )
);

create table public.language_progress (
  username_key text not null references public.profiles (username_key) on delete cascade,
  problem_id text not null references public.problems (id) on delete cascade,
  language public.language not null,
  attempted boolean not null default false,
  latest_submission_id uuid references public.submissions (id),
  pinned_best_submission_id uuid references public.submissions (id),
  last_activity_at timestamptz not null default now(),
  primary key (username_key, problem_id, language)
);

create table public.solved_versions (
  username_key text not null references public.profiles (username_key) on delete cascade,
  problem_id text not null references public.problems (id) on delete cascade,
  problem_version_id uuid not null references public.problem_versions (id) on delete cascade,
  language public.language not null,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  solved_at timestamptz not null default now(),
  primary key (username_key, problem_version_id, language)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  type public.activity_event_type not null,
  username_key text not null,
  display_username text not null,
  problem_id text null,
  problem_title text null,
  problem_version_id uuid null,
  problem_version_number integer null,
  submission_id uuid null,
  language public.language null,
  submission_solved boolean null,
  created_at timestamptz not null default now()
);

create index problem_versions_problem_status_version
  on public.problem_versions (problem_id, status, version_number desc nulls last);

create index submissions_user_problem_language_created
  on public.submissions (username_key, problem_id, language, created_at desc);

create index submissions_problem_version_created
  on public.submissions (problem_id, problem_version_id, created_at desc);

create index submissions_problem_created
  on public.submissions (problem_id, created_at desc);

create index activity_events_created
  on public.activity_events (created_at desc);

create index solved_versions_user_problem
  on public.solved_versions (username_key, problem_id, language);
