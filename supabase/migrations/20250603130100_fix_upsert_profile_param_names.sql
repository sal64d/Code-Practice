-- PL/pgSQL treats names that collide with table columns as ambiguous in SQL
-- statements. Recreate affected RPCs with prefixed argument names.
--
-- Postgres does not allow CREATE OR REPLACE FUNCTION to rename input
-- parameters for an existing function signature, so these functions must be
-- dropped before being recreated.

drop function if exists public.upsert_profile(text, text);
drop function if exists public.pin_best_submission(uuid, text);
drop function if exists public.switch_problem_version(text, text, uuid);

create function public.upsert_profile(
  p_username_key text,
  p_display_username text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if p_username_key is null or p_username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  if p_display_username is null or btrim(p_display_username) = '' then
    raise exception 'display_username is required';
  end if;

  insert into public.profiles (
    username_key,
    display_username,
    last_auth_user_id
  )
  values (
    p_username_key,
    btrim(p_display_username),
    auth.uid()
  )
  on conflict on constraint profiles_pkey do update
  set
    display_username = excluded.display_username,
    last_auth_user_id = excluded.last_auth_user_id,
    updated_at = now()
  returning *
  into v_profile;

  return v_profile;
end;
$$;

create function public.pin_best_submission(
  p_submission_id uuid,
  p_username_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_profile public.profiles%rowtype;
  v_overall_state text;
begin
  if p_submission_id is null then
    raise exception 'submission_id is required';
  end if;

  if p_username_key is null or p_username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  select *
  into v_submission
  from public.submissions s
  where s.id = p_submission_id
    and s.username_key = p_username_key
  for update;

  if not found then
    raise exception 'submission not found for username';
  end if;

  select *
  into v_profile
  from public.profiles p
  where p.username_key = p_username_key;

  if not found then
    raise exception 'profile not found';
  end if;

  update public.submissions s
  set pinned_best = false
  where s.username_key = v_submission.username_key
    and s.problem_id = v_submission.problem_id
    and s.language = v_submission.language
    and s.pinned_best;

  update public.submissions s
  set pinned_best = true
  where s.id = p_submission_id;

  update public.problem_progress pp
  set
    pinned_best_submission_id = p_submission_id,
    last_activity_at = now()
  where pp.username_key = v_submission.username_key
    and pp.problem_id = v_submission.problem_id;

  update public.language_progress lp
  set
    pinned_best_submission_id = p_submission_id,
    last_activity_at = now()
  where lp.username_key = v_submission.username_key
    and lp.problem_id = v_submission.problem_id
    and lp.language = v_submission.language;

  v_overall_state := public.compute_problem_overall_state(
    v_submission.username_key,
    v_submission.problem_id
  );

  update public.problem_progress pp
  set overall_state = v_overall_state
  where pp.username_key = v_submission.username_key
    and pp.problem_id = v_submission.problem_id;

  insert into public.activity_events (
    type,
    username_key,
    display_username,
    problem_id,
    problem_title,
    problem_version_id,
    problem_version_number,
    submission_id,
    language,
    submission_solved
  )
  select
    'pinned_best_submission',
    v_submission.username_key,
    v_profile.display_username,
    v_submission.problem_id,
    pv.title,
    v_submission.problem_version_id,
    pv.version_number,
    v_submission.id,
    v_submission.language,
    v_submission.solved
  from public.problem_versions pv
  where pv.id = v_submission.problem_version_id;

  return jsonb_build_object(
    'submission_id', p_submission_id,
    'overall_state', v_overall_state
  );
end;
$$;

create function public.switch_problem_version(
  p_username_key text,
  p_problem_id text,
  p_problem_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version public.problem_versions%rowtype;
  v_overall_state text;
begin
  if p_username_key is null or p_username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  if p_problem_id is null or p_problem_version_id is null then
    raise exception 'problem_id and problem_version_id are required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.username_key = p_username_key
  ) then
    raise exception 'profile not found';
  end if;

  select *
  into v_version
  from public.problem_versions pv
  where pv.id = p_problem_version_id
    and pv.problem_id = p_problem_id;

  if not found then
    raise exception 'problem version not found';
  end if;

  if v_version.status <> 'published' then
    raise exception 'only published versions can be selected';
  end if;

  insert into public.problem_progress (
    username_key,
    problem_id,
    started_problem_version_id,
    latest_attempted_problem_version_id,
    overall_state,
    last_activity_at
  )
  values (
    p_username_key,
    p_problem_id,
    p_problem_version_id,
    p_problem_version_id,
    'attempted',
    now()
  )
  on conflict on constraint problem_progress_pkey do update
  set
    latest_attempted_problem_version_id = excluded.latest_attempted_problem_version_id,
    last_activity_at = now();

  v_overall_state := public.compute_problem_overall_state(
    p_username_key,
    p_problem_id
  );

  update public.problem_progress pp
  set overall_state = v_overall_state
  where pp.username_key = p_username_key
    and pp.problem_id = p_problem_id;

  return jsonb_build_object(
    'problem_id', p_problem_id,
    'problem_version_id', p_problem_version_id,
    'overall_state', v_overall_state
  );
end;
$$;

revoke all on function public.upsert_profile(text, text) from public;
revoke all on function public.pin_best_submission(uuid, text) from public;
revoke all on function public.switch_problem_version(text, text, uuid) from public;

grant execute on function public.upsert_profile(text, text) to authenticated;
grant execute on function public.pin_best_submission(uuid, text) to authenticated;
grant execute on function public.switch_problem_version(text, text, uuid) to authenticated;
