begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

-- Two people sign up; the second without a name.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-7000-8000-000000000401', 'lucia@example.com', '{"display_name": "Lucía", "locale": "en"}'),
  ('00000000-0000-7000-8000-000000000402', 'nameless@example.com', '{}');

-- Their households, kept by id: deleting an account clears created_by, and other accounts in the
-- local database can have the same names.
create temporary table personal on commit drop as
select user_id, household_id from public.memberships
where user_id in ('00000000-0000-7000-8000-000000000401', '00000000-0000-7000-8000-000000000402');

select results_eq(
  $$
    select h.name, h.type::text, h.currency::text, h.created_by
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where m.user_id = '00000000-0000-7000-8000-000000000401'
  $$,
  $$ values ('Lucía''s home', 'single', 'EUR', '00000000-0000-7000-8000-000000000401'::uuid) $$,
  'FR-ACC-003 sign-up creates a single household named after the user'
);

select results_eq(
  $$
    select m.role::text, m.family_role::text
    from public.memberships as m
    where m.user_id = '00000000-0000-7000-8000-000000000401'
  $$,
  $$ values ('owner', null::text) $$,
  'FR-ACC-003 the new user is its owner'
);

-- The single-person settings as SQL writes them. This only checks the trigger; whether they match
-- defaultSettings("single") in the domain is checked by tests/e2e/personal-household.spec.ts.
select is(
  (
    select h.settings
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where m.user_id = '00000000-0000-7000-8000-000000000401'
  ),
  '{
    "roles": "owner_only",
    "privateShoppingLists": false,
    "splitting": {"mode": "off"},
    "mealPlan": "personal",
    "privateExpenses": "creator",
    "mealSlots": ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
  }'::jsonb,
  'FR-ACC-003 the household has the single-person settings'
);

select is(
  (
    select h.name
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where m.user_id = '00000000-0000-7000-8000-000000000402'
  ),
  'User''s home',
  'FR-ACC-003 a sign-up without a name still gets a named household'
);

select is_empty(
  $$
    select 1 from pg_proc as p
    where p.pronamespace = 'private'::regnamespace
      and p.proname in (
        'personal_household_name', 'default_household_settings', 'create_personal_household'
      )
      and (
        has_function_privilege('authenticated', p.oid, 'execute')
        or has_function_privilege('anon', p.oid, 'execute')
      )
  $$,
  'NFR-SEC-001 only the sign-up trigger builds personal households'
);

-- Signed in as Lucía.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000401", "role": "authenticated"}';

select results_eq(
  $$ select name from public.households $$,
  $$ values ('Lucía''s home') $$,
  'FR-ACC-003 the new user sees their own household and nobody else''s'
);

reset role;

-- Updating the account (a new e-mail, a sign-in) never creates a second household.
update auth.users set email = 'lucia.new@example.com', last_sign_in_at = now()
where id = '00000000-0000-7000-8000-000000000401';

select is(
  (select count(*)::int from public.memberships where user_id = '00000000-0000-7000-8000-000000000401'),
  1,
  'FR-ACC-003 signing in again creates no second personal household'
);

-- Deleting an account takes its personal household with it: nobody else has anything there.
delete from auth.users where id = '00000000-0000-7000-8000-000000000402';

select is_empty(
  $$
    select 1 from public.households
    where id = (select household_id from personal where user_id = '00000000-0000-7000-8000-000000000402')
  $$,
  'FR-ACC-003 deleting an account deletes the personal household it was alone in'
);

-- A household with other members still keeps an owner: deleting its last owner's account waits
-- for #23 to decide what happens to it.
insert into auth.users (id, email)
values ('00000000-0000-7000-8000-000000000403', 'guest@example.com');

insert into public.memberships (household_id, user_id, role)
select m.household_id, '00000000-0000-7000-8000-000000000403', 'member'
from public.memberships as m
where m.user_id = '00000000-0000-7000-8000-000000000401';

select throws_ok(
  $$ delete from auth.users where id = '00000000-0000-7000-8000-000000000401' $$,
  '23514',
  'a household must keep at least one owner',
  'NFR-SEC-001 deleting the last owner of a household with other members is still refused'
);

-- Deleting every account of a household in one statement deletes it, whatever order the rows go in.
delete from auth.users
where id in ('00000000-0000-7000-8000-000000000401', '00000000-0000-7000-8000-000000000403');

select is_empty(
  $$
    select 1 from public.households
    where id = (select household_id from personal where user_id = '00000000-0000-7000-8000-000000000401')
  $$,
  'FR-ACC-003 deleting all the accounts of a household at once deletes the household'
);

select * from finish();
rollback;
