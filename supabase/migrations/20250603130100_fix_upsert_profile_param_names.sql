-- PL/pgSQL treats ON CONFLICT (username_key) as the parameter, not the column.
-- Prefix RPC arguments so they never collide with table column names.

create or replace function public.upsert_profile(
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
