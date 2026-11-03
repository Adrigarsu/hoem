-- Deleting your own account (FR-ACC-007, ADR-019). Runs with the user's own JWT, so the request path
-- never needs the service-role key (ADR-004). The cascades from auth.users and the trigger
-- private.ensure_household_keeps_owner do the rest: they delete the profile, the memberships and the
-- households the user was alone in, and refuse the last owner of a household with other members.

-- The same rule as before, now with the code the app matches, so it cannot be confused with any
-- other check violation a cascade may raise.
create or replace function private.ensure_household_keeps_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' then
    return null;
  end if;
  -- Locking the household makes two owners leaving at the same time check one after the other,
  -- instead of each seeing the other still there. No row means the household is being deleted.
  perform 1 from public.households where id = old.household_id for update;
  if not found then
    return null;
  end if;
  if exists (
    select 1 from public.memberships where household_id = old.household_id and role = 'owner'
  ) then
    return null;
  end if;
  -- The cascade from auth.users runs after the statement has removed the account rows, so a
  -- missing account means the account is being deleted, not that its owner is leaving. Members
  -- without an account are being deleted in the same statement, whatever order their rows go in.
  if not exists (select 1 from auth.users where id = old.user_id)
    and not exists (
      select 1
      from public.memberships as m
      join auth.users as u on u.id = m.user_id
      where m.household_id = old.household_id
    ) then
    delete from public.households where id = old.household_id;
    return null;
  end if;
  raise exception 'a household must keep at least one owner'
    using errcode = 'check_violation', hint = 'last_owner';
end;
$$;

-- Takes no user id, so it can only ever delete the caller. The typed e-mail is checked here too,
-- because the Data API can be called without going through the app.
create function private.delete_own_account(confirmation text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'not authenticated'
      using errcode = 'insufficient_privilege', hint = 'not_authenticated';
  end if;
  if not exists (
    select 1 from auth.users
    where id = caller and lower(email) = lower(btrim(confirmation))
  ) then
    raise exception 'the confirmation is not the e-mail of this account'
      using errcode = 'check_violation', hint = 'wrong_confirmation';
  end if;
  -- The service removes the files first, through the Storage API. Once the account is gone nobody
  -- could remove what is left, so a call that skipped the service is refused.
  if exists (
    select 1 from storage.objects
    where bucket_id = 'avatars' and (storage.foldername(name))[1] = caller::text
  ) then
    raise exception 'the avatar folder of this account is not empty'
      using errcode = 'check_violation', hint = 'files_left';
  end if;
  -- The last owner of a household with other members is refused by the trigger above.
  delete from auth.users where id = caller;
end;
$$;

revoke execute on function private.delete_own_account(text) from public, anon;
grant execute on function private.delete_own_account(text) to authenticated;

-- The API: a thin wrapper that runs as the caller.
create function public.delete_own_account(confirmation text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.delete_own_account(confirmation);
$$;

revoke execute on function public.delete_own_account(text) from public, anon;
grant execute on function public.delete_own_account(text) to authenticated;

-- A token issued before the deletion stays valid until it expires. Without a profile it can no longer
-- upload: nobody could remove a file stored after the account is gone (FR-ACC-007).
drop policy "avatars_insert_own" on storage.objects;

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles where id = (select auth.uid()))
  );
