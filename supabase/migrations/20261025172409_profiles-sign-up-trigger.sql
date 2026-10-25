-- Profiles (FR-ACC-001): value rules, privileges, updated_at and the trigger that creates one
-- per sign-up.

-- The locales the app ships. The single list in SQL, used by the check below and by the sign-up
-- trigger; it must match supportedLocales in src/lib/i18n/locales.ts (Spanish is phase 2).
create function public.is_supported_locale(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value in ('en');
$$;

-- Time zones the app can format: the IANA names Postgres knows, without the posix/ and right/
-- copies and the special entries that Intl.DateTimeFormat rejects.
create function public.is_app_time_zone(value text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select value !~ '^(posix|right)/'
    and value not in ('Factory', 'localtime', 'posixrules')
    and exists (select 1 from pg_catalog.pg_timezone_names where name = value);
$$;

alter table public.profiles
  add constraint profiles_locale check (public.is_supported_locale(locale));

-- A check constraint cannot read pg_timezone_names, so a trigger enforces the time zone on every
-- write, including updates sent straight to the API.
create function public.check_profile_time_zone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_app_time_zone(new.time_zone) then
    raise exception 'unsupported time zone: %', new.time_zone using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_profile_time_zone() from public, anon, authenticated;

create trigger profiles_check_time_zone
  before insert or update of time_zone on public.profiles
  for each row execute function public.check_profile_time_zone();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS already limits rows to their owner. Privileges add a second wall: signed-out visitors get
-- nothing, nobody inserts or deletes a profile directly (the trigger and the cascade from
-- auth.users do), users cannot change is_minor (NFR-LEG-001), and avatar_path stays read-only
-- until avatars are stored with their own path rules.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale, time_zone, theme) on public.profiles to authenticated;

-- Profile values from sign-up metadata. Anything missing or unexpected falls back to a safe
-- default instead of blocking the sign-up. A missing name becomes "User", never part of the
-- e-mail address, which other household members would see.
create function public.new_profile_values(metadata jsonb)
returns table (display_name text, locale text, time_zone text)
language sql
stable
set search_path = ''
as $$
  select
    left(
      coalesce(
        nullif(regexp_replace(metadata ->> 'display_name', '^[\s ]+|[\s ]+$', '', 'g'), ''),
        'User'
      ),
      50
    ),
    case when public.is_supported_locale(metadata ->> 'locale') then metadata ->> 'locale' else 'en' end,
    case when public.is_app_time_zone(metadata ->> 'time_zone') then metadata ->> 'time_zone' else 'UTC' end;
$$;

-- Runs as its owner because the signing-up user has no session yet.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale, time_zone)
  select new.id, v.display_name, v.locale, v.time_zone
  from public.new_profile_values(coalesce(new.raw_user_meta_data, '{}'::jsonb)) as v;
  return new;
end;
$$;

-- Only the trigger calls these; they are never reachable through the API.
revoke execute on function public.new_profile_values(jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts created before this migration (test sign-ups on staging) get a profile too.
insert into public.profiles (id, display_name, locale, time_zone)
select u.id, v.display_name, v.locale, v.time_zone
from auth.users as u
cross join lateral public.new_profile_values(coalesce(u.raw_user_meta_data, '{}'::jsonb)) as v
on conflict (id) do nothing;
