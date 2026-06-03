-- Compound write RPC functions (US-005)

create or replace function public.compute_problem_overall_state(
  p_username_key text,
  p_problem_id text
)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_current_version_id uuid;
  v_solved_latest boolean;
  v_solved_any boolean;
begin
  select current_published_version_id
  into v_current_version_id
  from public.problems
  where id = p_problem_id;

  if not exists (
    select 1
    from public.problem_progress
    where username_key = p_username_key
      and problem_id = p_problem_id
  ) then
    return 'unattempted';
  end if;

  if v_current_version_id is not null then
    select exists (
      select 1
      from public.solved_versions
      where username_key = p_username_key
        and problem_id = p_problem_id
        and problem_version_id = v_current_version_id
    )
    into v_solved_latest;

    if v_solved_latest then
      return 'solved_current_version';
    end if;
  end if;

  select exists (
    select 1
    from public.solved_versions
    where username_key = p_username_key
      and problem_id = p_problem_id
  )
  into v_solved_any;

  if v_solved_any and v_current_version_id is not null then
    return 'solved_previous_version_latest_unsolved';
  end if;

  return 'attempted';
end;
$$;

create or replace function public.upsert_profile(
  username_key text,
  display_username text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if upsert_profile.username_key is null
    or upsert_profile.username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  if upsert_profile.display_username is null
    or btrim(upsert_profile.display_username) = '' then
    raise exception 'display_username is required';
  end if;

  insert into public.profiles (
    username_key,
    display_username,
    last_auth_user_id
  )
  values (
    upsert_profile.username_key,
    btrim(upsert_profile.display_username),
    auth.uid()
  )
  on conflict (username_key) do update
  set
    display_username = excluded.display_username,
    last_auth_user_id = excluded.last_auth_user_id,
    updated_at = now()
  returning *
  into v_profile;

  return v_profile;
end;
$$;

create or replace function public.publish_problem_version(draft_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.problem_versions%rowtype;
  v_next_version integer;
  v_profile public.profiles%rowtype;
  v_source_type public.problem_source_type;
begin
  if draft_version_id is null then
    raise exception 'draft_version_id is required';
  end if;

  select *
  into v_draft
  from public.problem_versions
  where id = draft_version_id
  for update;

  if not found then
    raise exception 'draft problem version not found';
  end if;

  if v_draft.status <> 'draft' then
    raise exception 'only draft versions can be published';
  end if;

  if v_draft.visible_test_count <= 0 then
    raise exception 'problem must include at least one visible test';
  end if;

  select coalesce(
    max(version_number),
    0
  ) + 1
  into v_next_version
  from public.problem_versions
  where problem_id = v_draft.problem_id
    and version_number is not null;

  update public.problem_versions
  set
    status = 'published',
    version_number = v_next_version,
    published_at = now(),
    updated_at = now()
  where id = draft_version_id
  returning *
  into v_draft;

  select *
  into v_profile
  from public.profiles
  where username_key = v_draft.created_by_username_key;

  if exists (select 1 from public.problems where id = v_draft.problem_id) then
    select source_type
    into v_source_type
    from public.problems
    where id = v_draft.problem_id;

    update public.problems
    set
      title = v_draft.title,
      difficulty = v_draft.difficulty,
      tags = v_draft.tags,
      supported_languages = v_draft.supported_languages,
      current_published_version_id = v_draft.id,
      updated_at = now()
    where id = v_draft.problem_id;
  else
    v_source_type := 'user_upload';

    insert into public.problems (
      id,
      source_type,
      title,
      difficulty,
      tags,
      supported_languages,
      current_published_version_id,
      created_by_username_key
    )
    values (
      v_draft.problem_id,
      v_source_type,
      v_draft.title,
      v_draft.difficulty,
      v_draft.tags,
      v_draft.supported_languages,
      v_draft.id,
      v_draft.created_by_username_key
    );
  end if;

  insert into public.activity_events (
    type,
    username_key,
    display_username,
    problem_id,
    problem_title,
    problem_version_id,
    problem_version_number
  )
  values (
    'published_problem',
    coalesce(v_draft.created_by_username_key, 'unknown'),
    coalesce(v_profile.display_username, v_draft.created_by_username_key, 'unknown'),
    v_draft.problem_id,
    v_draft.title,
    v_draft.id,
    v_draft.version_number
  );

  return jsonb_build_object(
    'problem_id', v_draft.problem_id,
    'problem_version_id', v_draft.id,
    'version_number', v_draft.version_number,
    'title', v_draft.title,
    'status', v_draft.status
  );
end;
$$;

create or replace function public.commit_submission(input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid;
  v_username_key text;
  v_problem_id text;
  v_problem_version_id uuid;
  v_language public.language;
  v_code_storage_path text;
  v_code_preview text;
  v_result jsonb;
  v_passed integer;
  v_total integer;
  v_solved boolean;
  v_duration_ms integer;
  v_stdout_bytes integer;
  v_version public.problem_versions%rowtype;
  v_profile public.profiles%rowtype;
  v_display_username text;
  v_already_solved boolean;
  v_overall_state text;
begin
  if input is null then
    raise exception 'input is required';
  end if;

  v_submission_id := (input ->> 'id')::uuid;
  v_username_key := input ->> 'username_key';
  v_problem_id := input ->> 'problem_id';
  v_problem_version_id := (input ->> 'problem_version_id')::uuid;
  v_language := (input ->> 'language')::public.language;
  v_code_storage_path := input ->> 'code_storage_path';
  v_code_preview := coalesce(input ->> 'code_preview', '');
  v_result := input -> 'result';

  if v_submission_id is null then
    raise exception 'submission id is required';
  end if;

  if v_username_key is null or v_username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  if v_problem_id is null or v_problem_version_id is null or v_language is null then
    raise exception 'problem_id, problem_version_id, and language are required';
  end if;

  if v_code_storage_path is null or btrim(v_code_storage_path) = '' then
    raise exception 'code_storage_path is required';
  end if;

  if v_result is null then
    raise exception 'result is required';
  end if;

  select *
  into v_profile
  from public.profiles
  where username_key = v_username_key;

  if not found then
    raise exception 'profile not found for username_key';
  end if;

  v_display_username := v_profile.display_username;

  select *
  into v_version
  from public.problem_versions
  where id = v_problem_version_id
    and problem_id = v_problem_id;

  if not found then
    raise exception 'problem version not found';
  end if;

  if v_version.status <> 'published' then
    raise exception 'submissions must target a published problem version';
  end if;

  if not (v_language = any (v_version.supported_languages)) then
    raise exception 'language is not supported for this problem version';
  end if;

  v_passed := coalesce((v_result ->> 'passed')::integer, 0);
  v_total := coalesce((v_result ->> 'total')::integer, 0);
  v_duration_ms := coalesce((v_result ->> 'durationMs')::integer, (v_result ->> 'duration_ms')::integer, 0);
  v_stdout_bytes := coalesce((v_result ->> 'stdoutBytes')::integer, (v_result ->> 'stdout_bytes')::integer, 0);

  if v_total <= 0 then
    raise exception 'total must be greater than zero';
  end if;

  if v_passed < 0 or v_passed > v_total then
    raise exception 'passed must be between 0 and total';
  end if;

  v_solved := v_passed = v_total;

  insert into public.submissions (
    id,
    username_key,
    problem_id,
    problem_version_id,
    language,
    code_storage_path,
    code_preview,
    result,
    passed,
    total,
    solved,
    duration_ms,
    stdout_bytes
  )
  values (
    v_submission_id,
    v_username_key,
    v_problem_id,
    v_problem_version_id,
    v_language,
    v_code_storage_path,
    v_code_preview,
    v_result,
    v_passed,
    v_total,
    v_solved,
    v_duration_ms,
    v_stdout_bytes
  );

  insert into public.problem_progress as pp (
    username_key,
    problem_id,
    started_problem_version_id,
    latest_attempted_problem_version_id,
    overall_state,
    last_activity_at
  )
  values (
    v_username_key,
    v_problem_id,
    v_problem_version_id,
    v_problem_version_id,
    'attempted',
    now()
  )
  on conflict on constraint problem_progress_pkey do update
  set
    latest_attempted_problem_version_id = excluded.latest_attempted_problem_version_id,
    last_activity_at = now();

  insert into public.language_progress as lp (
    username_key,
    problem_id,
    language,
    attempted,
    latest_submission_id,
    last_activity_at
  )
  values (
    v_username_key,
    v_problem_id,
    v_language,
    true,
    v_submission_id,
    now()
  )
  on conflict on constraint language_progress_pkey do update
  set
    attempted = true,
    latest_submission_id = excluded.latest_submission_id,
    last_activity_at = now();

  if v_solved then
    insert into public.solved_versions (
      username_key,
      problem_id,
      problem_version_id,
      language,
      submission_id
    )
    values (
      v_username_key,
      v_problem_id,
      v_problem_version_id,
      v_language,
      v_submission_id
    )
    on conflict on constraint solved_versions_pkey do update
    set
      submission_id = excluded.submission_id,
      solved_at = now();
  end if;

  v_overall_state := public.compute_problem_overall_state(v_username_key, v_problem_id);

  update public.problem_progress
  set
    overall_state = v_overall_state,
    last_activity_at = now()
  where username_key = v_username_key
    and problem_id = v_problem_id;

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
  values (
    'submitted_attempt',
    v_username_key,
    v_display_username,
    v_problem_id,
    v_version.title,
    v_problem_version_id,
    v_version.version_number,
    v_submission_id,
    v_language,
    v_solved
  );

  select exists (
    select 1
    from public.solved_versions
    where username_key = v_username_key
      and problem_id = v_problem_id
      and problem_version_id = v_problem_version_id
      and language = v_language
      and submission_id <> v_submission_id
  )
  into v_already_solved;

  if v_solved and not v_already_solved then
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
    values (
      'solved_problem',
      v_username_key,
      v_display_username,
      v_problem_id,
      v_version.title,
      v_problem_version_id,
      v_version.version_number,
      v_submission_id,
      v_language,
      true
    );
  end if;

  with ranked as (
    select
      s.id,
      row_number() over (order by s.created_at desc) as rn
    from public.submissions s
    where s.username_key = v_username_key
      and s.problem_id = v_problem_id
      and s.language = v_language
      and not s.pinned_best
      and not s.archived
  )
  update public.submissions s
  set archived = true
  from ranked r
  where s.id = r.id
    and r.rn > 20;

  return jsonb_build_object(
    'submission_id', v_submission_id,
    'solved', v_solved,
    'passed', v_passed,
    'total', v_total,
    'overall_state', v_overall_state
  );
end;
$$;

create or replace function public.pin_best_submission(
  submission_id uuid,
  username_key text
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
  if submission_id is null then
    raise exception 'submission_id is required';
  end if;

  if username_key is null or username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  select *
  into v_submission
  from public.submissions
  where id = submission_id
    and username_key = pin_best_submission.username_key
  for update;

  if not found then
    raise exception 'submission not found for username';
  end if;

  select *
  into v_profile
  from public.profiles
  where username_key = pin_best_submission.username_key;

  if not found then
    raise exception 'profile not found';
  end if;

  update public.submissions
  set pinned_best = false
  where username_key = v_submission.username_key
    and problem_id = v_submission.problem_id
    and language = v_submission.language
    and pinned_best;

  update public.submissions
  set pinned_best = true
  where id = submission_id;

  update public.problem_progress
  set
    pinned_best_submission_id = submission_id,
    last_activity_at = now()
  where username_key = v_submission.username_key
    and problem_id = v_submission.problem_id;

  update public.language_progress
  set
    pinned_best_submission_id = submission_id,
    last_activity_at = now()
  where username_key = v_submission.username_key
    and problem_id = v_submission.problem_id
    and language = v_submission.language;

  v_overall_state := public.compute_problem_overall_state(
    v_submission.username_key,
    v_submission.problem_id
  );

  update public.problem_progress
  set overall_state = v_overall_state
  where username_key = v_submission.username_key
    and problem_id = v_submission.problem_id;

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
    'submission_id', submission_id,
    'overall_state', v_overall_state
  );
end;
$$;

create or replace function public.switch_problem_version(
  username_key text,
  problem_id text,
  problem_version_id uuid
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
  if username_key is null or username_key !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid username_key';
  end if;

  if problem_id is null or problem_version_id is null then
    raise exception 'problem_id and problem_version_id are required';
  end if;

  if not exists (
    select 1 from public.profiles p where p.username_key = switch_problem_version.username_key
  ) then
    raise exception 'profile not found';
  end if;

  select *
  into v_version
  from public.problem_versions
  where id = problem_version_id
    and problem_versions.problem_id = switch_problem_version.problem_id;

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
    switch_problem_version.username_key,
    switch_problem_version.problem_id,
    problem_version_id,
    problem_version_id,
    'attempted',
    now()
  )
  on conflict on constraint problem_progress_pkey do update
  set
    latest_attempted_problem_version_id = excluded.latest_attempted_problem_version_id,
    last_activity_at = now();

  v_overall_state := public.compute_problem_overall_state(
    switch_problem_version.username_key,
    switch_problem_version.problem_id
  );

  update public.problem_progress
  set overall_state = v_overall_state
  where username_key = switch_problem_version.username_key
    and problem_id = switch_problem_version.problem_id;

  return jsonb_build_object(
    'problem_id', problem_id,
    'problem_version_id', problem_version_id,
    'overall_state', v_overall_state
  );
end;
$$;

revoke all on function public.compute_problem_overall_state(text, text) from public;
revoke all on function public.upsert_profile(text, text) from public;
revoke all on function public.publish_problem_version(uuid) from public;
revoke all on function public.commit_submission(jsonb) from public;
revoke all on function public.pin_best_submission(uuid, text) from public;
revoke all on function public.switch_problem_version(text, text, uuid) from public;

grant execute on function public.upsert_profile(text, text) to authenticated;
grant execute on function public.publish_problem_version(uuid) to authenticated;
grant execute on function public.commit_submission(jsonb) to authenticated;
grant execute on function public.pin_best_submission(uuid, text) to authenticated;
grant execute on function public.switch_problem_version(text, text, uuid) to authenticated;
