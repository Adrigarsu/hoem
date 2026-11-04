-- Google sign-in (FR-ACC-002): OAuth sign-ups cannot send display_name, so Supabase Auth stores
-- Google's claims as the metadata instead. Same signature and same results for the e-mail sign-up,
-- so the deployed code keeps working (ADR-014). Runs only when an account is created: linking Google
-- to an existing account never changes its name.

create function private.trimmed_name(name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(regexp_replace(name, '^[\s ]+|[\s ]+$', '', 'g'), '');
$$;

-- A Google account can use its address as its name, and other household members see this one. The
-- name typed in the sign-up form is the user's own choice, so it is not checked.
create function private.name_from_claim(claim text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when claim like '%@%' then null else private.trimmed_name(claim) end;
$$;

revoke execute on function private.trimmed_name(text) from public, anon, authenticated;
revoke execute on function private.name_from_claim(text) from public, anon, authenticated;

create or replace function public.new_profile_values(metadata jsonb)
returns table (display_name text, locale text, time_zone text)
language sql
stable
set search_path = ''
as $$
  select
    -- Trimmed again because cutting a long name can leave a space at the end.
    private.trimmed_name(
      left(
        coalesce(
          private.trimmed_name(metadata ->> 'display_name'),
          private.name_from_claim(metadata ->> 'full_name'),
          private.name_from_claim(metadata ->> 'name'),
          'User'
        ),
        50
      )
    ),
    case when public.is_supported_locale(metadata ->> 'locale') then metadata ->> 'locale' else 'en' end,
    case when public.is_app_time_zone(metadata ->> 'time_zone') then metadata ->> 'time_zone' else 'UTC' end;
$$;
