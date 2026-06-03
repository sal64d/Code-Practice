-- Fix ambiguous username_key / display_username in upsert_profile (login RPC)

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
