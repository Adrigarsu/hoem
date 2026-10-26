begin;
create extension if not exists pgtap with schema extensions;

select plan(43);

-- People (docs/architecture.md §7.5): the García family (two parents, a child, a relative), the
-- Calle Mayor flat (two flatmates) and an outsider with a household of her own.
insert into auth.users (id, email)
values
  ('00000000-0000-7000-8000-000000000101', 'pilar@example.com'),
  ('00000000-0000-7000-8000-000000000102', 'pablo@example.com'),
  ('00000000-0000-7000-8000-000000000103', 'carla@example.com'),
  ('00000000-0000-7000-8000-000000000104', 'rosa@example.com'),
  ('00000000-0000-7000-8000-000000000201', 'lucia@example.com'),
  ('00000000-0000-7000-8000-000000000202', 'marcos@example.com'),
  ('00000000-0000-7000-8000-000000000301', 'olga@example.com');

-- Sign-up gives each of them a personal household (personal-household.test.sql); these tests use
-- the households below instead.
delete from public.households
where created_by in (
  '00000000-0000-7000-8000-000000000101', '00000000-0000-7000-8000-000000000102',
  '00000000-0000-7000-8000-000000000103', '00000000-0000-7000-8000-000000000104',
  '00000000-0000-7000-8000-000000000201', '00000000-0000-7000-8000-000000000202',
  '00000000-0000-7000-8000-000000000301'
);

insert into public.households (id, name, type, created_by)
values
  ('00000000-0000-7000-8000-00000000a001', 'García family', 'family', '00000000-0000-7000-8000-000000000101'),
  ('00000000-0000-7000-8000-00000000a002', 'Calle Mayor flat', 'shared_flat', '00000000-0000-7000-8000-000000000201'),
  ('00000000-0000-7000-8000-00000000a003', 'Olga', 'single', '00000000-0000-7000-8000-000000000301');

insert into public.memberships (household_id, user_id, role, family_role)
values
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000101', 'owner', 'parent'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000102', 'member', 'parent'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000103', 'member', 'child'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000104', 'member', 'relative'),
  ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000201', 'owner', null),
  ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000202', 'member', null),
  ('00000000-0000-7000-8000-00000000a003', '00000000-0000-7000-8000-000000000301', 'owner', null);

-- Structure.

select ok(
  (select relrowsecurity from pg_class where oid = 'public.households'::regclass),
  'NFR-SEC-001 row-level security is enabled on households'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.memberships'::regclass),
  'NFR-SEC-001 row-level security is enabled on memberships'
);

select results_eq(
  $$
    select p.proname::text collate "default", p.prosecdef, p.provolatile::text collate "default",
      array_to_string(p.proconfig, ',') collate "default"
    from pg_proc as p
    where p.pronamespace = 'private'::regnamespace
      and p.proname in ('is_member', 'is_owner', 'is_parent', 'can_manage_members')
    order by p.proname
  $$,
  $$
    values
      ('can_manage_members', true, 's', 'search_path=""'),
      ('is_member', true, 's', 'search_path=""'),
      ('is_owner', true, 's', 'search_path=""'),
      ('is_parent', true, 's', 'search_path=""')
  $$,
  'NFR-SEC-001 the helpers are security definer, stable, with a fixed search_path, in the private schema the API does not expose'
);

select ok(
  not has_function_privilege('anon', 'private.is_member(uuid)', 'execute')
    and not has_function_privilege('anon', 'private.is_owner(uuid)', 'execute')
    and not has_function_privilege('anon', 'private.is_parent(uuid)', 'execute')
    and not has_function_privilege('anon', 'private.can_manage_members(uuid)', 'execute'),
  'NFR-SEC-001 signed-out visitors cannot call the helpers'
);

-- What each helper answers, per person: member, owner and parent of the family, can manage the
-- family, member of the flat, can manage the flat.
create function pg_temp.helpers_as(person uuid)
returns table (
  family_member boolean, family_owner boolean, family_parent boolean, family_manager boolean,
  flat_member boolean, flat_manager boolean
)
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', person, 'role', 'authenticated')::text, true);
  return query select
    private.is_member('00000000-0000-7000-8000-00000000a001'),
    private.is_owner('00000000-0000-7000-8000-00000000a001'),
    private.is_parent('00000000-0000-7000-8000-00000000a001'),
    private.can_manage_members('00000000-0000-7000-8000-00000000a001'),
    private.is_member('00000000-0000-7000-8000-00000000a002'),
    private.can_manage_members('00000000-0000-7000-8000-00000000a002');
end;
$$;

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000101') $$,
  $$ values (true, true, true, true, false, false) $$,
  'NFR-SEC-001 the owner parent is member, owner, parent and manager of the family only'
);

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000102') $$,
  $$ values (true, false, true, true, false, false) $$,
  'NFR-SEC-001 the other parent can manage the family without being an owner (FR-HH-006)'
);

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000103') $$,
  $$ values (true, false, false, false, false, false) $$,
  'NFR-SEC-001 the child is a member of the family and nothing more'
);

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000104') $$,
  $$ values (true, false, false, false, false, false) $$,
  'NFR-SEC-001 the relative is a member of the family and nothing more'
);

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000201') $$,
  $$ values (false, false, false, false, true, true) $$,
  'NFR-SEC-001 the flat owner manages the flat only'
);

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000202') $$,
  $$ values (false, false, false, false, true, false) $$,
  'NFR-SEC-001 a flatmate who is not an owner cannot manage the flat'
);

select results_eq(
  $$ select * from pg_temp.helpers_as('00000000-0000-7000-8000-000000000301') $$,
  $$ values (false, false, false, false, false, false) $$,
  'NFR-SEC-001 the outsider belongs to neither household'
);

-- Signed in as the outsider.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000301", "role": "authenticated"}';

select results_eq(
  'select name from public.households',
  $$ values ('Olga') $$,
  'NFR-SEC-001 an outsider reads only her own household'
);

select is_empty(
  $$ select 1 from public.memberships where household_id <> '00000000-0000-7000-8000-00000000a003' $$,
  'NFR-SEC-001 an outsider cannot read the memberships of another household'
);

update public.households set name = 'Taken' where id = '00000000-0000-7000-8000-00000000a002';
delete from public.households where id = '00000000-0000-7000-8000-00000000a002';
update public.memberships set role = 'owner'
  where household_id = '00000000-0000-7000-8000-00000000a002';
delete from public.memberships where household_id = '00000000-0000-7000-8000-00000000a002';
reset role;

select is(
  (select name from public.households where id = '00000000-0000-7000-8000-00000000a002'),
  'Calle Mayor flat',
  'NFR-SEC-001 an outsider cannot rename or delete another household'
);

select results_eq(
  $$
    select user_id::text, role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002' order by user_id
  $$,
  $$
    values
      ('00000000-0000-7000-8000-000000000201', 'owner'),
      ('00000000-0000-7000-8000-000000000202', 'member')
  $$,
  'NFR-SEC-001 an outsider cannot change or delete the memberships of another household'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000301", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.households (name, type) values ('Mine', 'single') $$,
  '42501',
  null,
  'NFR-SEC-001 households are not created by inserting rows directly'
);

select throws_ok(
  $$
    insert into public.memberships (household_id, user_id, role)
    values ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000301', 'member')
  $$,
  '42501',
  null,
  'NFR-SEC-001 nobody joins a household by inserting a membership directly'
);

-- Signed in as a flatmate who is not an owner.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000202", "role": "authenticated"}';

select results_eq(
  'select name from public.households',
  $$ values ('Calle Mayor flat') $$,
  'NFR-SEC-001 a member reads her own household'
);

select results_eq(
  'select user_id::text from public.memberships order by user_id',
  $$ values ('00000000-0000-7000-8000-000000000201'), ('00000000-0000-7000-8000-000000000202') $$,
  'NFR-SEC-001 a member reads the member list of her household'
);

update public.households set name = 'Renamed' where id = '00000000-0000-7000-8000-00000000a002';
update public.memberships set role = 'owner'
  where user_id = '00000000-0000-7000-8000-000000000202';
reset role;

select is(
  (select name from public.households where id = '00000000-0000-7000-8000-00000000a002'),
  'Calle Mayor flat',
  'NFR-SEC-001 a member who is not an owner cannot rename the household'
);

select is(
  (
    select role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000202'
  ),
  'member',
  'NFR-SEC-001 a flatmate who is not an owner cannot change roles, not even her own'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000202", "role": "authenticated"}';

select throws_ok(
  $$ update public.households set type = 'other' where id = '00000000-0000-7000-8000-00000000a002' $$,
  '42501',
  null,
  'FR-ACC-009 the household type is not changed by a direct update'
);

-- Signed in as the flat owner.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

update public.households set name = 'Calle Mayor 12' where id = '00000000-0000-7000-8000-00000000a002';
reset role;

select is(
  (select name from public.households where id = '00000000-0000-7000-8000-00000000a002'),
  'Calle Mayor 12',
  'NFR-SEC-001 an owner renames her household'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

select throws_ok(
  $$
    update public.memberships set role = 'member'
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000201'
  $$,
  '23514',
  null,
  'NFR-SEC-001 the last owner cannot be demoted'
);

select throws_ok(
  $$
    delete from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000201'
  $$,
  '23514',
  null,
  'NFR-SEC-001 the last owner cannot leave or be removed'
);

update public.memberships set role = 'owner'
  where household_id = '00000000-0000-7000-8000-00000000a002'
    and user_id = '00000000-0000-7000-8000-000000000202';
update public.memberships set role = 'member'
  where household_id = '00000000-0000-7000-8000-00000000a002'
    and user_id = '00000000-0000-7000-8000-000000000201';
reset role;

select results_eq(
  $$
    select user_id::text, role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002' order by user_id
  $$,
  $$
    values
      ('00000000-0000-7000-8000-000000000201', 'member'),
      ('00000000-0000-7000-8000-000000000202', 'owner')
  $$,
  'NFR-SEC-001 an owner hands over ownership: promote first, then step down'
);

-- Signed in as the flatmate who now owns the flat: the old owner leaves on his own.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

delete from public.memberships
  where household_id = '00000000-0000-7000-8000-00000000a002'
    and user_id = '00000000-0000-7000-8000-000000000201';
reset role;

select is_empty(
  $$
    select 1 from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a002'
      and user_id = '00000000-0000-7000-8000-000000000201'
  $$,
  'NFR-SEC-001 a member who is not the last owner can leave'
);

-- Signed in as the parent who is not an owner: he manages the family, but not its owners.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

select throws_ok(
  $$
    update public.memberships set role = 'owner'
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000102'
  $$,
  '42501',
  null,
  'NFR-SEC-001 a parent who is not an owner cannot make himself an owner'
);

update public.memberships set family_role = 'relative'
  where household_id = '00000000-0000-7000-8000-00000000a001'
    and user_id = '00000000-0000-7000-8000-000000000101';
delete from public.memberships
  where household_id = '00000000-0000-7000-8000-00000000a001'
    and user_id = '00000000-0000-7000-8000-000000000101';
reset role;

select results_eq(
  $$
    select role::text, family_role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000101'
  $$,
  $$ values ('owner', 'parent') $$,
  'NFR-SEC-001 a parent who is not an owner cannot change or remove an owner'
);

-- Signed in as the relative.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000104", "role": "authenticated"}';

update public.households set name = 'Ours' where id = '00000000-0000-7000-8000-00000000a001';
update public.memberships set family_role = 'parent'
  where household_id = '00000000-0000-7000-8000-00000000a001'
    and user_id = '00000000-0000-7000-8000-000000000104';
reset role;

select results_eq(
  $$
    select h.name, m.family_role::text
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where h.id = '00000000-0000-7000-8000-00000000a001'
      and m.user_id = '00000000-0000-7000-8000-000000000104'
  $$,
  $$ values ('García family', 'relative') $$,
  'FR-HH-006 a relative cannot rename the family or make herself a parent'
);

-- Signed in as the parent who owns the family.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000101", "role": "authenticated"}';

select throws_ok(
  $$ update public.households set settings = '{"splits": "equal"}' where id = '00000000-0000-7000-8000-00000000a001' $$,
  '42501',
  null,
  'FR-HH-009 household settings are not changed by a direct update'
);

update public.memberships set role = 'owner'
  where household_id = '00000000-0000-7000-8000-00000000a001'
    and user_id = '00000000-0000-7000-8000-000000000102';
reset role;

select is(
  (
    select role::text from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000102'
  ),
  'owner',
  'NFR-SEC-001 the owner parent can make the other parent an owner'
);

-- Signed in as the parent who is not an owner.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

update public.memberships set can_join_splits = false
  where household_id = '00000000-0000-7000-8000-00000000a001'
    and user_id = '00000000-0000-7000-8000-000000000103';
reset role;

select is(
  (
    select can_join_splits from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000103'
  ),
  false,
  'NFR-SEC-001 a parent can change a member of the family (FR-HH-006)'
);

-- Signed in as the child.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000103", "role": "authenticated"}';

update public.memberships set can_join_splits = true
  where household_id = '00000000-0000-7000-8000-00000000a001'
    and user_id = '00000000-0000-7000-8000-000000000103';
reset role;

select is(
  (
    select can_join_splits from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000103'
  ),
  false,
  'NFR-SEC-001 a child cannot change memberships, not even her own'
);

-- Family roles.

select throws_ok(
  $$
    update public.memberships set family_role = null
    where household_id = '00000000-0000-7000-8000-00000000a001'
      and user_id = '00000000-0000-7000-8000-000000000104'
  $$,
  '23514',
  null,
  'NFR-SEC-001 every member of a family household has a family role'
);

select throws_ok(
  $$
    insert into public.memberships (household_id, user_id, role, family_role)
    values ('00000000-0000-7000-8000-00000000a003', '00000000-0000-7000-8000-000000000101', 'member', 'parent')
  $$,
  '23514',
  null,
  'NFR-SEC-001 a family role is refused outside family households'
);

select lives_ok(
  $$
    insert into public.memberships (household_id, user_id, role)
    values ('00000000-0000-7000-8000-00000000a003', '00000000-0000-7000-8000-000000000101', 'member')
  $$,
  'NFR-SEC-001 a member of a non-family household needs no family role'
);

select is(
  (
    select can_join_splits from public.memberships
    where household_id = '00000000-0000-7000-8000-00000000a003'
      and user_id = '00000000-0000-7000-8000-000000000101'
  ),
  true,
  'FR-HH-009 a new member can join splits by default'
);

-- Changing the type must leave the family roles consistent by the end of the transaction.
update public.households set type = 'family' where id = '00000000-0000-7000-8000-00000000a003';
select throws_ok(
  'set constraints households_family_roles_consistent immediate',
  '23514',
  null,
  'FR-ACC-009 a household cannot become a family while members have no family role'
);

-- Signed out.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  'select * from public.households',
  '42501',
  null,
  'NFR-SEC-001 signed-out visitors cannot read households'
);

select throws_ok(
  'select * from public.memberships',
  '42501',
  null,
  'NFR-SEC-001 signed-out visitors cannot read memberships'
);

reset role;

-- Deleting a household takes its memberships with it, last owner included.
delete from public.households where id = '00000000-0000-7000-8000-00000000a001';
select is_empty(
  $$ select 1 from public.memberships where household_id = '00000000-0000-7000-8000-00000000a001' $$,
  'NFR-SEC-001 deleting a household deletes its memberships, last owner included'
);

update public.households set updated_at = '2000-01-01'
  where id = '00000000-0000-7000-8000-00000000a002';
update public.households set name = 'Calle Mayor 12, 3º'
  where id = '00000000-0000-7000-8000-00000000a002';
select ok(
  (select updated_at > '2000-01-01' from public.households where id = '00000000-0000-7000-8000-00000000a002'),
  'NFR-SEC-001 changing a household refreshes updated_at'
);

select * from finish();
rollback;
