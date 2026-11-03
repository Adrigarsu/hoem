begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- Lucía is alone in her personal household. Ana owns a flat Marcos created and belongs to. Olga and
-- Pilar own a household together. Nico only has his personal household.
insert into auth.users (id, email)
values
  ('00000000-0000-7000-8000-000000000601', 'lucia@example.com'),
  ('00000000-0000-7000-8000-000000000602', 'marcos@example.com'),
  ('00000000-0000-7000-8000-000000000603', 'ana@example.com'),
  ('00000000-0000-7000-8000-000000000604', 'olga@example.com'),
  ('00000000-0000-7000-8000-000000000605', 'pilar@example.com'),
  ('00000000-0000-7000-8000-000000000606', 'nico@example.com');

insert into public.households (id, name, type, settings, created_by)
values
  (
    '00000000-0000-7000-8000-00000000c001', 'Calle Mayor 5', 'shared_flat',
    private.default_household_settings('shared_flat'),
    '00000000-0000-7000-8000-000000000602'
  ),
  (
    '00000000-0000-7000-8000-00000000c002', 'Shared by two', 'shared_flat',
    private.default_household_settings('shared_flat'),
    '00000000-0000-7000-8000-000000000604'
  );

insert into public.memberships (household_id, user_id, role)
values
  ('00000000-0000-7000-8000-00000000c001', '00000000-0000-7000-8000-000000000603', 'owner'),
  ('00000000-0000-7000-8000-00000000c001', '00000000-0000-7000-8000-000000000602', 'member'),
  ('00000000-0000-7000-8000-00000000c002', '00000000-0000-7000-8000-000000000604', 'owner'),
  ('00000000-0000-7000-8000-00000000c002', '00000000-0000-7000-8000-000000000605', 'owner');

-- Kept by id: deleting an account clears created_by, and the household goes with it.
create temporary table lucia_home on commit drop as
select household_id from public.memberships
where user_id = '00000000-0000-7000-8000-000000000601';

create temporary table ana_home on commit drop as
select household_id from public.memberships
where user_id = '00000000-0000-7000-8000-000000000603' and role = 'owner'
  and household_id <> '00000000-0000-7000-8000-00000000c001';

-- The stable code a statement fails with, read from the HINT the app matches. The exception block
-- undoes whatever the statement did, as the end of a refused request would.
create function pg_temp.hint_of(statement text)
returns text
language plpgsql
as $$
declare
  code text;
begin
  execute statement;
  return null;
exception when others then
  get stacked diagnostics code = pg_exception_hint;
  return code;
end;
$$;

-- Structure and privileges.

select is(
  has_function_privilege('anon', 'public.delete_own_account(text)', 'execute'),
  false,
  'FR-ACC-007 anon cannot execute it'
);

select is(
  has_function_privilege('anon', 'private.delete_own_account(text)', 'execute'),
  false,
  'FR-ACC-007 anon cannot execute the function behind it'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.delete_own_account(text)'::regprocedure),
  false,
  'NFR-SEC-001 the function the Data API exposes runs as the caller'
);

select is(
  (select prosecdef from pg_proc where oid = 'private.delete_own_account(text)'::regprocedure),
  true,
  'FR-ACC-007 only the function outside the Data API runs with more privileges'
);

-- Refusals: nothing is deleted.

set local role authenticated;
set local request.jwt.claims = '{"role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.delete_own_account('lucia@example.com') $$),
  'not_authenticated',
  'FR-ACC-007 it needs a session'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000601", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.delete_own_account('someone@example.com') $$),
  'wrong_confirmation',
  'FR-ACC-007 a wrong e-mail is refused'
);

select is(
  pg_temp.hint_of($$ select public.delete_own_account('') $$),
  'wrong_confirmation',
  'FR-ACC-007 an empty confirmation is refused'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000602", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.delete_own_account('ana@example.com') $$),
  'wrong_confirmation',
  'FR-ACC-007 it can never delete another user: typing their e-mail is a wrong confirmation'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000603", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.delete_own_account('ana@example.com') $$),
  'last_owner',
  'FR-ACC-007 the last owner of a household with members is refused'
);

-- The same code when the last owner leaves without deleting the account.
select is(
  pg_temp.hint_of(
    $$
      delete from public.memberships
      where household_id = '00000000-0000-7000-8000-00000000c001'
        and user_id = '00000000-0000-7000-8000-000000000603'
    $$
  ),
  'last_owner',
  'FR-ACC-007 the last owner leaving a household fails with the same code'
);

reset role;

select results_eq(
  $$
    select count(*)::int from auth.users
    where id in (
      '00000000-0000-7000-8000-000000000601', '00000000-0000-7000-8000-000000000602',
      '00000000-0000-7000-8000-000000000603'
    )
  $$,
  $$ values (3) $$,
  'FR-ACC-007 a refused deletion deletes no account'
);

select results_eq(
  $$
    select count(*)::int from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000c001'
  $$,
  $$ values (2) $$,
  'FR-ACC-007 a refused deletion leaves the household and its members alone'
);

select results_eq(
  $$
    select count(*)::int from public.households
    where id in (select household_id from ana_home)
  $$,
  $$ values (1) $$,
  'FR-ACC-007 a refused deletion also keeps the household the user was alone in'
);

-- Deleting the account of someone alone in their household.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000601", "role": "authenticated"}';

select lives_ok(
  $$ select public.delete_own_account('lucia@example.com') $$,
  'FR-ACC-007 a user deletes their own account as themselves, not as a superuser'
);

reset role;

select is_empty(
  $$ select 1 from auth.users where id = '00000000-0000-7000-8000-000000000601' $$,
  'FR-ACC-007 the account is gone'
);

select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-7000-8000-000000000601' $$,
  'FR-ACC-007 the profile is gone'
);

select is_empty(
  $$ select 1 from public.memberships where user_id = '00000000-0000-7000-8000-000000000601' $$,
  'FR-ACC-007 the memberships are gone'
);

select is_empty(
  $$ select 1 from public.households where id in (select household_id from lucia_home) $$,
  'FR-ACC-007 deleting an account deletes the household the user was alone in'
);

-- A token issued before the deletion stays valid until it expires: it must not store new personal
-- data that nobody could remove.
set local role authenticated;

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values ('avatars', '00000000-0000-7000-8000-000000000601/after-deletion.webp')
  $$,
  '42501',
  null,
  'FR-ACC-007 a token that outlives its account cannot upload a photo'
);

reset role;

-- A member who is not an owner: the household and everyone else stay.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000602", "role": "authenticated"}';

select lives_ok(
  $$ select public.delete_own_account('marcos@example.com') $$,
  'FR-ACC-007 a member can delete their account'
);

reset role;

select results_eq(
  $$
    select h.created_by, m.user_id
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where h.id = '00000000-0000-7000-8000-00000000c001'
  $$,
  $$ values (null::uuid, '00000000-0000-7000-8000-000000000603'::uuid) $$,
  'FR-ACC-007 a member''s deletion leaves the household, its members and created_by null'
);

-- One of two owners.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000604", "role": "authenticated"}';

select lives_ok(
  $$ select public.delete_own_account('olga@example.com') $$,
  'FR-ACC-007 a co-owner can delete their account'
);

reset role;

select results_eq(
  $$
    select m.user_id, m.role::text from public.memberships as m
    where m.household_id = '00000000-0000-7000-8000-00000000c002'
  $$,
  $$ values ('00000000-0000-7000-8000-000000000605'::uuid, 'owner') $$,
  'FR-ACC-007 the other owner keeps the household'
);

-- Files left in the user's folder: nobody could remove them once the account is gone, and the Data
-- API can be called without the service removing them first.
insert into storage.objects (bucket_id, name)
values ('avatars', '00000000-0000-7000-8000-000000000605/photo.webp');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000605", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.delete_own_account('pilar@example.com') $$),
  'files_left',
  'FR-ACC-007 an account with photos left in its folder is refused'
);

reset role;

select isnt_empty(
  $$ select 1 from auth.users where id = '00000000-0000-7000-8000-000000000605' $$,
  'FR-ACC-007 that refusal keeps the account'
);

-- How the e-mail is typed.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000606", "role": "authenticated"}';

select lives_ok(
  $$ select public.delete_own_account('  NICO@Example.com ') $$,
  'FR-ACC-007 the e-mail check ignores case and surrounding spaces'
);

reset role;

select is_empty(
  $$ select 1 from auth.users where id = '00000000-0000-7000-8000-000000000606' $$,
  'FR-ACC-007 that confirmation deletes the account'
);

select * from finish();
rollback;
