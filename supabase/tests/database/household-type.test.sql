begin;
create extension if not exists pgtap with schema extensions;

select plan(32);

-- People: Lucía owns a flat shared with Marcos and Ana; Pilar owns a family with Carla, who is under
-- 14; Olga and Nico belong to no shared household (Nico is a minor).
insert into auth.users (id, email)
values
  ('00000000-0000-7000-8000-000000000501', 'lucia@example.com'),
  ('00000000-0000-7000-8000-000000000502', 'marcos@example.com'),
  ('00000000-0000-7000-8000-000000000503', 'ana@example.com'),
  ('00000000-0000-7000-8000-000000000504', 'pilar@example.com'),
  ('00000000-0000-7000-8000-000000000505', 'carla@example.com'),
  ('00000000-0000-7000-8000-000000000506', 'olga@example.com'),
  ('00000000-0000-7000-8000-000000000507', 'nico@example.com');

update public.profiles set is_minor = true
where id in ('00000000-0000-7000-8000-000000000505', '00000000-0000-7000-8000-000000000507');

-- Sign-up gives each of them a personal household (personal-household.test.sql); these tests use
-- the households below instead.
delete from public.households
where created_by in (
  '00000000-0000-7000-8000-000000000501', '00000000-0000-7000-8000-000000000502',
  '00000000-0000-7000-8000-000000000503', '00000000-0000-7000-8000-000000000504',
  '00000000-0000-7000-8000-000000000505', '00000000-0000-7000-8000-000000000506',
  '00000000-0000-7000-8000-000000000507'
);

-- The flat stores only three meal slots, to check that a type change keeps them.
insert into public.households (id, name, type, settings, created_by)
values
  (
    '00000000-0000-7000-8000-00000000b001', 'Calle Mayor 5', 'shared_flat',
    private.default_household_settings('shared_flat')
      || '{"mealSlots": ["breakfast", "lunch", "dinner"]}'::jsonb,
    '00000000-0000-7000-8000-000000000501'
  ),
  (
    '00000000-0000-7000-8000-00000000b002', 'García family', 'family',
    private.default_household_settings('family'),
    '00000000-0000-7000-8000-000000000504'
  );

insert into public.memberships (household_id, user_id, role, family_role)
values
  ('00000000-0000-7000-8000-00000000b001', '00000000-0000-7000-8000-000000000501', 'owner', null),
  ('00000000-0000-7000-8000-00000000b001', '00000000-0000-7000-8000-000000000502', 'member', null),
  ('00000000-0000-7000-8000-00000000b001', '00000000-0000-7000-8000-000000000503', 'member', null),
  ('00000000-0000-7000-8000-00000000b002', '00000000-0000-7000-8000-000000000504', 'owner', 'parent'),
  ('00000000-0000-7000-8000-00000000b002', '00000000-0000-7000-8000-000000000505', 'member', 'child');

-- Structure and privileges.

-- The Data API exposes only the public wrappers, which run as the caller; the work is done by
-- security definer functions in the private schema (.claude/rules/database.md).
select results_eq(
  $$
    select p.pronamespace::regnamespace::text collate "default", p.proname::text collate "default",
      p.prosecdef, array_to_string(p.proconfig, ',') collate "default"
    from pg_proc as p
    where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
      and p.proname in ('create_household', 'change_household_type')
    order by 1, 2
  $$,
  $$
    values
      ('private', 'change_household_type', true, 'search_path=""'),
      ('private', 'create_household', true, 'search_path=""'),
      ('public', 'change_household_type', false, 'search_path=""'),
      ('public', 'create_household', false, 'search_path=""')
  $$,
  'NFR-SEC-001 the API wrappers run as the caller; only the private functions are security definer'
);

select ok(
  has_function_privilege('authenticated', 'public.create_household(text, public.household_type)', 'execute')
    and has_function_privilege(
      'authenticated', 'public.change_household_type(uuid, public.household_type, jsonb)', 'execute'
    ),
  'FR-ACC-009 signed-in users can call both functions'
);

select ok(
  not has_function_privilege('anon', 'public.create_household(text, public.household_type)', 'execute')
    and not has_function_privilege(
      'anon', 'public.change_household_type(uuid, public.household_type, jsonb)', 'execute'
    ),
  'NFR-SEC-001 anonymous visitors cannot call them'
);

select ok(
  not has_function_privilege(
    'authenticated', 'private.default_household_settings(public.household_type)', 'execute'
  ),
  'NFR-SEC-001 the settings are chosen by the database, never sent by the client'
);

select hasnt_function(
  'private', 'single_household_settings', 'FR-HH-001 one function holds the settings of every type'
);

-- The rules of each type. Whether they equal defaultSettings(type) in the domain is checked by
-- tests/e2e/household-type.spec.ts.
select results_eq(
  $$
    select t::text, private.default_household_settings(t) ->> 'roles',
      private.default_household_settings(t) ->> 'privateExpenses'
    from unnest(enum_range(null::public.household_type)) as t
    order by 1
  $$,
  $$
    values
      ('family', 'family', 'creator_and_parents_for_children'),
      ('other', 'owner_or_member', 'creator'),
      ('shared_flat', 'owner_or_member', 'creator'),
      ('single', 'owner_only', 'creator')
  $$,
  'FR-HH-001 each type has its own rules, and "other" starts like a shared flat'
);

-- Creating a household.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000506", "role": "authenticated"}';

create temporary table created (kind text, id uuid) on commit drop;
insert into created
values
  ('flat', public.create_household('  Calle Mayor 5  ', 'shared_flat')),
  ('family', public.create_household('Olga''s family', 'family'));

select results_eq(
  $$
    select h.name, h.type::text, h.created_by, m.user_id, m.role::text, m.family_role::text
    from created as c
    join public.households as h on h.id = c.id
    join public.memberships as m on m.household_id = h.id
    order by c.kind
  $$,
  $$
    values
      ('Olga''s family', 'family', '00000000-0000-7000-8000-000000000506'::uuid,
        '00000000-0000-7000-8000-000000000506'::uuid, 'owner', 'parent'),
      ('Calle Mayor 5', 'shared_flat', '00000000-0000-7000-8000-000000000506'::uuid,
        '00000000-0000-7000-8000-000000000506'::uuid, 'owner', null)
  $$,
  'FR-ACC-009 the creator owns the new household; in a family she starts as a parent'
);

reset role;

select is(
  (select h.settings from created as c join public.households as h on h.id = c.id where c.kind = 'flat'),
  private.default_household_settings('shared_flat'),
  'FR-ACC-009 a new household uses the rules of its type'
);

set local role authenticated;

select throws_ok(
  $$ select public.create_household('   ', 'shared_flat') $$,
  '23514', 'a household needs a name of 1 to 60 characters',
  'FR-ACC-009 a household needs a name'
);

select throws_ok(
  format($$ select public.create_household(%L, 'shared_flat') $$, repeat('a', 61)),
  '23514', 'a household needs a name of 1 to 60 characters',
  'FR-ACC-009 a household name has at most 60 characters'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000507", "role": "authenticated"}';

select throws_ok(
  $$ select public.create_household('Nico''s flat', 'shared_flat') $$,
  '42501', 'people under 14 join a household through a parent',
  'NFR-LEG-001 someone under 14 cannot create a household'
);

set local request.jwt.claims = '{"role": "authenticated"}';

select throws_ok(
  $$ select public.create_household('Nobody''s home', 'single') $$,
  '42501', 'not authenticated',
  'FR-ACC-009 creating a household needs a signed-in user'
);

-- Who can change the type.

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000502", "role": "authenticated"}';

select throws_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'other') $$,
  '42501', 'only an owner changes the household type',
  'FR-ACC-009 a member who is not an owner cannot change the type'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000506", "role": "authenticated"}';

select throws_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'other') $$,
  '42501', 'only an owner changes the household type',
  'FR-ACC-009 someone outside the household cannot change the type'
);

-- Types the household cannot take.

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000501", "role": "authenticated"}';

select throws_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'single') $$,
  '23514', 'a single-person household cannot have other members',
  'FR-ACC-009 a household with other members cannot become "just me"'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000504", "role": "authenticated"}';

select throws_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000b002', 'shared_flat') $$,
  '23514', 'a household with someone under 14 must stay a family',
  'NFR-LEG-001 a family with a child under 14 stays a family'
);

-- Becoming a family needs a family role for every member.

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000501", "role": "authenticated"}';

select throws_ok(
  $$
    select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'family', '{
      "00000000-0000-7000-8000-000000000501": "parent",
      "00000000-0000-7000-8000-000000000502": "child"
    }')
  $$,
  '23514', 'every member needs a family role',
  'FR-HH-007 becoming a family needs a role for every member'
);

select throws_ok(
  $$
    select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'family', '{
      "00000000-0000-7000-8000-000000000501": "parent",
      "00000000-0000-7000-8000-000000000502": "child",
      "00000000-0000-7000-8000-000000000503": "boss"
    }')
  $$,
  '23514', 'every member needs a family role',
  'FR-HH-007 a family role is parent, child or relative'
);

select throws_ok(
  $$
    select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'family', '{
      "00000000-0000-7000-8000-000000000501": "parent",
      "00000000-0000-7000-8000-000000000502": "child",
      "00000000-0000-7000-8000-000000000503": "relative",
      "00000000-0000-7000-8000-000000000506": "child"
    }')
  $$,
  '23514', 'family roles were given for people outside the household',
  'FR-HH-007 family roles name only members of the household'
);

select throws_ok(
  $$
    select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'family', '{
      "00000000-0000-7000-8000-000000000501": "relative",
      "00000000-0000-7000-8000-000000000502": "child",
      "00000000-0000-7000-8000-000000000503": "relative"
    }')
  $$,
  '23514', 'a family needs at least one parent',
  'FR-HH-007 a family needs at least one parent'
);

reset role;

select results_eq(
  $$
    select h.type::text, count(m.family_role)
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where h.id = '00000000-0000-7000-8000-00000000b001'
    group by h.type
  $$,
  $$ values ('shared_flat', 0::bigint) $$,
  'FR-HH-007 a refused change leaves the type and the roles as they were'
);

-- A valid change. The owner does not have to be a parent.

set local role authenticated;

select lives_ok(
  $$
    select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'family', '{
      "00000000-0000-7000-8000-000000000501": "relative",
      "00000000-0000-7000-8000-000000000502": "parent",
      "00000000-0000-7000-8000-000000000503": "child"
    }')
  $$,
  'FR-HH-007 the owner turns the flat into a family once every member has a role'
);

reset role;

select results_eq(
  $$
    select m.user_id, m.role::text, m.family_role::text
    from public.memberships as m
    where m.household_id = '00000000-0000-7000-8000-00000000b001'
    order by m.user_id
  $$,
  $$
    values
      ('00000000-0000-7000-8000-000000000501'::uuid, 'owner', 'relative'),
      ('00000000-0000-7000-8000-000000000502'::uuid, 'member', 'parent'),
      ('00000000-0000-7000-8000-000000000503'::uuid, 'member', 'child')
  $$,
  'FR-HH-007 each member gets the family role chosen, and ownership does not change'
);

select is(
  (select type::text from public.households where id = '00000000-0000-7000-8000-00000000b001'),
  'family',
  'FR-ACC-009 the household is now a family'
);

select is(
  (select settings from public.households where id = '00000000-0000-7000-8000-00000000b001'),
  private.default_household_settings('family')
    || '{"mealSlots": ["breakfast", "lunch", "dinner"]}'::jsonb,
  'FR-HH-007 the household takes the rules of its new type and keeps its meal slots'
);

-- The new rules work at once: Marcos is now the parent who manages members.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000502", "role": "authenticated"}';

select ok(
  private.can_manage_members('00000000-0000-7000-8000-00000000b001'),
  'FR-HH-006 after the change a parent manages the members'
);

-- Leaving the family clears the family roles; the owner can change it back.

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000501", "role": "authenticated"}';

select lives_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'other') $$,
  'FR-ACC-009 the owner changes the family into an "other" household'
);

reset role;

select results_eq(
  $$
    select h.type::text, count(m.family_role)
    from public.households as h
    join public.memberships as m on m.household_id = h.id
    where h.id = '00000000-0000-7000-8000-00000000b001'
    group by h.type
  $$,
  $$ values ('other', 0::bigint) $$,
  'FR-ACC-009 a household that stops being a family has no family roles'
);

select is(
  (select settings from public.households where id = '00000000-0000-7000-8000-00000000b001'),
  private.default_household_settings('other')
    || '{"mealSlots": ["breakfast", "lunch", "dinner"]}'::jsonb,
  'FR-HH-007 an "other" household starts with the shared-flat rules and keeps its meal slots'
);

-- Choosing the type it already has changes nothing.

set local role authenticated;

select lives_ok(
  $$ select public.change_household_type('00000000-0000-7000-8000-00000000b001', 'other') $$,
  'FR-ACC-009 choosing the current type is accepted'
);

reset role;

select is(
  (select settings ->> 'mealSlots' from public.households where id = '00000000-0000-7000-8000-00000000b001'),
  '["breakfast", "lunch", "dinner"]',
  'FR-ACC-009 choosing the current type leaves its settings as they were'
);

-- Only these functions change the type: the column stays out of reach of a direct update.

set local role authenticated;

select throws_ok(
  $$ update public.households set type = 'single' where id = '00000000-0000-7000-8000-00000000b001' $$,
  '42501', null,
  'NFR-SEC-001 the type cannot be changed by updating the table directly'
);

select * from finish();
rollback;
