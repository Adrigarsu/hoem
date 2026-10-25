begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

-- People sign up. Supabase Auth inserts into auth.users with the metadata the app sends.
insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-7000-8000-000000000001',
    'ana@example.com',
    '{"display_name": "Ana", "locale": "en", "time_zone": "Europe/Madrid"}'
  ),
  (
    '00000000-0000-7000-8000-000000000002',
    'ben@example.com',
    '{"display_name": "Ben", "locale": "xx", "time_zone": "Mars/Olympus"}'
  ),
  ('00000000-0000-7000-8000-000000000003', 'maria.private@example.com', '{}'),
  ('00000000-0000-7000-8000-000000000004', null, '{}'),
  ('00000000-0000-7000-8000-000000000005', 'dee@example.com', '{"display_name": " \t  "}'),
  (
    '00000000-0000-7000-8000-000000000006',
    'eve@example.com',
    '{"display_name": "  Eve  ", "time_zone": "posix/Europe/Madrid"}'
  );

select results_eq(
  $$
    select display_name, locale, time_zone, theme, is_minor
    from public.profiles where id = '00000000-0000-7000-8000-000000000001'
  $$,
  $$ values ('Ana', 'en', 'Europe/Madrid', 'system', false) $$,
  'FR-ACC-001 sign-up creates a profile with the name, locale and time zone sent by the app'
);

select results_eq(
  $$
    select locale, time_zone from public.profiles
    where id = '00000000-0000-7000-8000-000000000002'
  $$,
  $$ values ('en', 'UTC') $$,
  'FR-ACC-001 an unsupported locale falls back to en and an unknown time zone to UTC'
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-7000-8000-000000000003'),
  'User',
  'FR-ACC-001 a sign-up without a name gets a neutral name, never part of the e-mail'
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-7000-8000-000000000004'),
  'User',
  'FR-ACC-001 an account without an e-mail or a name still gets a profile'
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-7000-8000-000000000005'),
  'User',
  'FR-ACC-001 a name made only of white space counts as no name'
);

select results_eq(
  $$
    select display_name, time_zone from public.profiles
    where id = '00000000-0000-7000-8000-000000000006'
  $$,
  $$ values ('Eve', 'UTC') $$,
  'FR-ACC-001 the name is trimmed and a time zone the app cannot format falls back to UTC'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'NFR-SEC-001 row-level security is enabled on profiles'
);

-- Signed in as Ana.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000001", "role": "authenticated"}';

select results_eq(
  'select display_name from public.profiles',
  $$ values ('Ana') $$,
  'NFR-SEC-001 a user reads only their own profile'
);

update public.profiles set display_name = 'Ana B.' where id = '00000000-0000-7000-8000-000000000001';
select is(
  (select display_name from public.profiles where id = '00000000-0000-7000-8000-000000000001'),
  'Ana B.',
  'NFR-SEC-001 a user updates their own profile'
);

update public.profiles set display_name = 'Hacked' where id = '00000000-0000-7000-8000-000000000002';
reset role;
select is(
  (select display_name from public.profiles where id = '00000000-0000-7000-8000-000000000002'),
  'Ben',
  'NFR-SEC-001 a user cannot update someone else''s profile'
);
set local role authenticated;

select throws_ok(
  $$ update public.profiles set is_minor = true where id = '00000000-0000-7000-8000-000000000001' $$,
  '42501',
  null,
  'NFR-LEG-001 a user cannot change is_minor on their own profile'
);

select throws_ok(
  $$ update public.profiles set locale = 'zz' where id = '00000000-0000-7000-8000-000000000001' $$,
  '23514',
  null,
  'NFR-I18N-001 a user cannot set a locale the app does not support'
);

select throws_ok(
  $$
    update public.profiles set time_zone = 'posix/Europe/Madrid'
    where id = '00000000-0000-7000-8000-000000000001'
  $$,
  '23514',
  null,
  'NFR-I18N-002 a user cannot set a time zone the app cannot format'
);

select throws_ok(
  $$ update public.profiles set avatar_path = 'x/y.png' where id = '00000000-0000-7000-8000-000000000001' $$,
  '42501',
  null,
  'NFR-SEC-001 avatar_path is not writable until avatars exist'
);

select throws_ok(
  $$
    insert into public.profiles (id, display_name)
    values ('00000000-0000-7000-8000-000000000001', 'Twin')
  $$,
  '42501',
  null,
  'NFR-SEC-001 profiles are created only by the sign-up trigger'
);

select throws_ok(
  $$ delete from public.profiles where id = '00000000-0000-7000-8000-000000000001' $$,
  '42501',
  null,
  'NFR-SEC-001 a profile is deleted only with its account'
);

-- Signed out.
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'NFR-SEC-001 signed-out visitors cannot read profiles'
);

reset role;
delete from auth.users where id = '00000000-0000-7000-8000-000000000003';
select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-7000-8000-000000000003' $$,
  'FR-ACC-001 deleting an account deletes its profile'
);

select * from finish();
rollback;
