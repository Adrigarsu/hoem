begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

-- People (docs/architecture.md §7.5): the García family (two parents, a child, a relative), the
-- Calle Mayor flat (two flatmates) and an outsider with a household of her own.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-7000-8000-000000000101', 'pilar@example.com', '{"display_name": "Pilar"}'),
  ('00000000-0000-7000-8000-000000000102', 'pablo@example.com', '{"display_name": "Pablo"}'),
  ('00000000-0000-7000-8000-000000000103', 'carla@example.com', '{"display_name": "Carla"}'),
  ('00000000-0000-7000-8000-000000000104', 'rosa@example.com', '{"display_name": "Rosa"}'),
  ('00000000-0000-7000-8000-000000000201', 'lucia@example.com', '{"display_name": "Lucía"}'),
  ('00000000-0000-7000-8000-000000000202', 'marcos@example.com', '{"display_name": "Marcos"}'),
  ('00000000-0000-7000-8000-000000000301', 'olga@example.com', '{"display_name": "Olga"}');

-- Sign-up gives each of them a personal household (personal-household.test.sql); these tests use
-- the households below instead, except Olga, who keeps hers.
delete from public.households
where created_by in (
  '00000000-0000-7000-8000-000000000101', '00000000-0000-7000-8000-000000000102',
  '00000000-0000-7000-8000-000000000103', '00000000-0000-7000-8000-000000000104',
  '00000000-0000-7000-8000-000000000201', '00000000-0000-7000-8000-000000000202'
);

update public.profiles set avatar_path = '00000000-0000-7000-8000-000000000202/photo.webp'
where id = '00000000-0000-7000-8000-000000000202';

insert into public.households (id, name, type, settings, created_by)
values
  (
    '00000000-0000-7000-8000-00000000a001', 'García family', 'family',
    private.default_household_settings('family'), '00000000-0000-7000-8000-000000000101'
  ),
  (
    '00000000-0000-7000-8000-00000000a002', 'Calle Mayor flat', 'shared_flat',
    private.default_household_settings('shared_flat'), '00000000-0000-7000-8000-000000000201'
  );

-- Joined on different days, so the joining order is the order of the rows.
insert into public.memberships (household_id, user_id, role, family_role, created_at)
values
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000101', 'owner', 'parent', now() - interval '4 days'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000102', 'member', 'parent', now() - interval '3 days'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000103', 'member', 'child', now() - interval '2 days'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000104', 'member', 'relative', now() - interval '1 day'),
  ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000201', 'owner', null, now() - interval '2 days'),
  ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000202', 'member', null, now() - interval '1 day');

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

-- Structure.

select results_eq(
  $$
    select p.prosecdef, p.provolatile::text collate "default",
      array_to_string(p.proconfig, ',') collate "default"
    from pg_proc as p
    where p.oid = 'private.household_members(uuid)'::regprocedure
  $$,
  $$ values (true, 's', 'search_path=""') $$,
  'NFR-SEC-001 the member list is security definer, stable, with a fixed search_path, in the private schema'
);

select is(
  pg_get_function_result('public.household_members(uuid)'::regprocedure),
  'TABLE(user_id uuid, role member_role, family_role family_role, display_name text, avatar_path text)',
  'NFR-SEC-001 the member list returns the role, name and photo only, never age, locale or time zone'
);

select ok(
  not has_function_privilege('anon', 'public.household_members(uuid)', 'execute')
    and not has_function_privilege('anon', 'private.household_members(uuid)', 'execute'),
  'NFR-SEC-001 signed-out visitors cannot read the member list'
);

select ok(
  not has_function_privilege('authenticated', 'private.ensure_family_keeps_parent()', 'execute'),
  'NFR-SEC-001 nobody calls the last-parent check outside its trigger'
);

-- Signed in as a flatmate who is not an owner.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000202", "role": "authenticated"}';

select results_eq(
  $$ select * from public.household_members('00000000-0000-7000-8000-00000000a002') $$,
  $$
    values
      ('00000000-0000-7000-8000-000000000201'::uuid, 'owner'::public.member_role, null::public.family_role, 'Lucía', null::text),
      ('00000000-0000-7000-8000-000000000202'::uuid, 'member'::public.member_role, null::public.family_role, 'Marcos', '00000000-0000-7000-8000-000000000202/photo.webp')
  $$,
  'FR-ACC-006 every member sees each member''s name, photo and role, in joining order'
);

select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-7000-8000-000000000201' $$,
  'NFR-SEC-001 the rest of another member''s profile stays private'
);

select is_empty(
  $$ select 1 from public.household_members('00000000-0000-7000-8000-00000000a001') $$,
  'NFR-SEC-001 a household you do not belong to has no member list for you'
);

delete from public.memberships
where household_id = '00000000-0000-7000-8000-00000000a002'
  and user_id = '00000000-0000-7000-8000-000000000201';
reset role;

select is(
  (select count(*)::int from public.memberships where household_id = '00000000-0000-7000-8000-00000000a002'),
  2,
  'FR-ACC-006 a flatmate who is not an owner cannot remove anyone'
);

-- Signed in as the outsider.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000301", "role": "authenticated"}';

select is_empty(
  $$ select 1 from public.household_members('00000000-0000-7000-8000-00000000a002') $$,
  'NFR-SEC-001 an outsider cannot read the member list of another household'
);

-- Signed in as the flat owner.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

update public.memberships set role = 'owner'
where household_id = '00000000-0000-7000-8000-00000000a002'
  and user_id = '00000000-0000-7000-8000-000000000202';
reset role;

select is(
  (
    select role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000202'
  ),
  'owner',
  'FR-ACC-006 the owner of a shared flat makes a member an owner'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

delete from public.memberships
where household_id = '00000000-0000-7000-8000-00000000a002'
  and user_id = '00000000-0000-7000-8000-000000000202';
reset role;

select is_empty(
  $$
    select 1 from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000202'
  $$,
  'FR-ACC-006 the owner of a shared flat removes a member'
);

-- Signed in as the parent who is not an owner.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

update public.memberships set family_role = 'parent'
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000104';
reset role;

select is(
  (
    select family_role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000104'
  ),
  'parent',
  'FR-HH-006 a parent makes a member a parent'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

update public.memberships set family_role = 'relative'
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000104';
update public.memberships set family_role = 'relative'
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000103';
reset role;

select results_eq(
  $$
    select family_role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id in ('00000000-0000-7000-8000-000000000103', '00000000-0000-7000-8000-000000000104')
    order by user_id
  $$,
  $$ values ('relative'), ('relative') $$,
  'FR-HH-006 a parent sets a member''s family role to relative'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

update public.memberships set family_role = 'child'
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000103';
reset role;

select is(
  (
    select family_role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000103'
  ),
  'child',
  'FR-HH-006 a parent sets a member''s family role to child'
);

-- Signed in as the relative.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000104", "role": "authenticated"}';

select results_eq(
  $$ select display_name from public.household_members('00000000-0000-7000-8000-00000000a001') $$,
  $$ values ('Pilar'), ('Pablo'), ('Carla'), ('Rosa') $$,
  'FR-HH-008 a relative sees the family members like any member'
);

update public.memberships set family_role = 'relative'
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000103';
delete from public.memberships
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000103';
reset role;

select is(
  (
    select family_role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000103'
  ),
  'child',
  'FR-HH-008 a relative cannot change roles or remove anyone'
);

-- Signed in as the owner parent: she steps down as a parent while Pablo still is one.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000101", "role": "authenticated"}';

update public.memberships set family_role = 'relative'
where household_id = '00000000-0000-7000-8000-00000000a001'
  and user_id = '00000000-0000-7000-8000-000000000101';
reset role;

select is(
  (
    select family_role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000101'
  ),
  'relative',
  'FR-HH-006 a parent stops being a parent while another parent remains'
);

-- Pablo is now the only parent.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    update public.memberships set family_role = 'relative'
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000102'
  $$),
  'last_parent',
  'FR-HH-006 the last parent cannot stop being a parent'
);

select is(
  pg_temp.hint_of($$
    delete from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000102'
  $$),
  'last_parent',
  'FR-HH-006 the last parent cannot leave the family'
);

select is(
  pg_temp.hint_of($$ select public.delete_own_account('pablo@example.com') $$),
  'last_parent',
  'FR-HH-006 the last parent cannot delete their account while the family has other members'
);
reset role;

select is(
  pg_temp.hint_of($$
    delete from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000102'
  $$),
  'last_parent',
  'FR-HH-006 the last parent cannot be removed, not even bypassing the policies'
);

-- Signed in as the flat owner, who is alone in the flat now.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    update public.memberships set role = 'member'
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000201'
  $$),
  'last_owner',
  'FR-ACC-006 the only owner cannot demote themselves'
);
reset role;

-- The family stops being one: the type change clears every family role (FR-ACC-009).
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000101", "role": "authenticated"}';

select lives_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000a001', 'shared_flat') $$,
  'FR-HH-006 a family that changes its type no longer needs a parent'
);
reset role;

-- Olga founds a family alone, as its only parent, and deletes her account.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000301", "role": "authenticated"}';

select public.create_household('Olga family', 'family');
reset role;

-- Kept by id: deleting the account clears created_by.
create temporary table olga_family on commit drop as
select id from public.households
where created_by = '00000000-0000-7000-8000-000000000301' and type = 'family';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000301", "role": "authenticated"}';

select lives_ok(
  $$ select public.delete_own_account('olga@example.com') $$,
  'FR-HH-006 the only person of a family deletes their account, and the family goes with them'
);
reset role;

select is_empty(
  $$ select 1 from public.households where id = (select id from olga_family) $$,
  'FR-ACC-007 the family of its last member is deleted with the account'
);

select * from finish();
rollback;
