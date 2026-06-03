-- Prototype RLS: authenticated users only (US-004)

alter table public.profiles enable row level security;
alter table public.problems enable row level security;
alter table public.problem_versions enable row level security;
alter table public.attempts enable row level security;
alter table public.submissions enable row level security;
alter table public.problem_progress enable row level security;
alter table public.language_progress enable row level security;
alter table public.solved_versions enable row level security;
alter table public.activity_events enable row level security;

-- Broad prototype policies: any authenticated session may read/write app data.
-- Username is the app identity, not auth.uid(). This is intentionally weak.

create policy "Authenticated full access on profiles"
  on public.profiles
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on problems"
  on public.problems
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on problem_versions"
  on public.problem_versions
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on attempts"
  on public.attempts
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on submissions"
  on public.submissions
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on problem_progress"
  on public.problem_progress
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on language_progress"
  on public.language_progress
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on solved_versions"
  on public.solved_versions
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access on activity_events"
  on public.activity_events
  for all
  to authenticated
  using (true)
  with check (true);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
