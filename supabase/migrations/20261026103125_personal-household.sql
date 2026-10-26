--custom
-- Personal household (FR-ACC-003): every sign-up gets a single-person household it owns, created by
-- the same trigger and in the same transaction as the profile, so an account never exists without
-- one and signing in again never makes a second.

-- The household name in the user's language. Next.js messages are out of reach of a trigger, so the
-- texts live here; add a case with each locale is_supported_locale accepts. The user can rename it.
create function private.personal_household_name(display_name text, locale text)
returns text
language sql
immutable
set search_path = ''
as $$
  -- English is the only locale so far (Spanish is phase 2).
  select display_name || '''s home';
$$;

-- The same values as defaultSettings("single") in src/features/households/domain/household-rules.ts.
-- tests/e2e/personal-household.spec.ts parses what this stores with the domain schema and compares
-- it with the domain defaults, so a change on one side without the other fails there.
create function private.single_household_settings()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "roles": "owner_only",
    "privateShoppingLists": false,
    "splitting": {"mode": "off"},
    "mealPlan": "personal",
    "privateExpenses": "creator",
    "mealSlots": ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
  }'::jsonb;
$$;

-- Creates the user's personal household with the user as its owner.
create function private.create_personal_household(user_id uuid, display_name text, locale text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name, type, settings, created_by)
  values (
    private.personal_household_name(display_name, locale),
    'single',
    private.single_household_settings(),
    user_id
  )
  returning id into new_household_id;

  insert into public.memberships (household_id, user_id, role)
  values (new_household_id, user_id, 'owner');
end;
$$;

-- Only the sign-up trigger and the backfill below build personal households.
revoke execute on function private.personal_household_name(text, text) from public, anon, authenticated;
revoke execute on function private.single_household_settings() from public, anon, authenticated;
revoke execute on function private.create_personal_household(uuid, text, text)
  from public, anon, authenticated;

-- Runs as its owner because the signing-up user has no session yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
begin
  insert into public.profiles (id, display_name, locale, time_zone)
  select new.id, v.display_name, v.locale, v.time_zone
  from public.new_profile_values(coalesce(new.raw_user_meta_data, '{}'::jsonb)) as v
  returning * into profile;

  perform private.create_personal_household(new.id, profile.display_name, profile.locale);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Accounts created before this migration (test sign-ups on staging) that belong to no household get
-- their personal one too. Minors join only a family household (NFR-LEG-001), so they get none.
select private.create_personal_household(p.id, p.display_name, p.locale)
from public.profiles as p
where not p.is_minor
  and not exists (select 1 from public.memberships as m where m.user_id = p.id);

-- Every account now owns a household, so deleting an account would always hit the last-owner rule.
-- A household the account was alone in holds nobody else's data and goes with the account. One
-- that still has members keeps refusing until deleting an account in the app (#23) decides.
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
  raise exception 'a household must keep at least one owner' using errcode = 'check_violation';
end;
$$;
