begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Ana and Ben share a flat, Rui left it, and Olga only has her personal household.
insert into auth.users (id, email)
values
  ('00000000-0000-7000-8000-000000000001', 'ana@example.com'),
  ('00000000-0000-7000-8000-000000000002', 'ben@example.com'),
  ('00000000-0000-7000-8000-000000000003', 'olga@example.com'),
  ('00000000-0000-7000-8000-000000000004', 'rui@example.com');

insert into public.households (id, name, type, created_by)
values ('00000000-0000-7000-8000-00000000a001', 'Calle Mayor flat', 'shared_flat', '00000000-0000-7000-8000-000000000001');

insert into public.memberships (household_id, user_id, role)
values
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000001', 'owner'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000002', 'member'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000004', 'member');

-- Ana's photo, stored the way the Storage API stores it.
insert into storage.objects (bucket_id, name)
values ('avatars', '00000000-0000-7000-8000-000000000001/photo.webp');

-- The Storage API deletes the file itself; this setting lets a test reach the delete policy.
set local storage.allow_delete_query = 'true';

select results_eq(
  $$ select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars' $$,
  $$ values (false, 2097152::bigint, array['image/webp']) $$,
  'FR-ACC-007 the avatars bucket is private and takes only small re-encoded images'
);

-- Reading.

set local role authenticated;

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000001", "role": "authenticated"}';
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars'),
  1::bigint,
  'FR-ACC-007 a user can read their own avatar'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000002", "role": "authenticated"}';
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars'),
  1::bigint,
  'FR-ACC-007 a household member can read the avatar of someone they share a household with'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000003", "role": "authenticated"}';
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars'),
  0::bigint,
  'FR-ACC-007 someone outside the user''s households cannot read their avatar'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars'),
  0::bigint,
  'FR-ACC-007 an anonymous visitor cannot read an avatar'
);

reset role;
delete from public.memberships
where user_id = '00000000-0000-7000-8000-000000000004'
  and household_id = '00000000-0000-7000-8000-00000000a001';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000004", "role": "authenticated"}';
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars'),
  0::bigint,
  'FR-ACC-007 a former member loses access to the avatar'
);

-- Writing.

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values ('avatars', '00000000-0000-7000-8000-000000000002/photo.webp')
  $$,
  'FR-ACC-007 a user uploads a file to their own folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values ('avatars', '00000000-0000-7000-8000-000000000001/planted.webp')
  $$,
  '42501',
  null,
  'FR-ACC-007 a user cannot upload to someone else''s folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', 'planted.webp') $$,
  '42501',
  null,
  'FR-ACC-007 a user cannot upload outside a folder'
);

delete from storage.objects
where bucket_id = 'avatars' and name = '00000000-0000-7000-8000-000000000001/photo.webp';
select is(
  (select count(*) from storage.objects where name = '00000000-0000-7000-8000-000000000001/photo.webp'),
  1::bigint,
  'FR-ACC-007 a household member cannot delete someone else''s avatar'
);

delete from storage.objects
where bucket_id = 'avatars' and name = '00000000-0000-7000-8000-000000000002/photo.webp';
select is(
  (select count(*) from storage.objects where name = '00000000-0000-7000-8000-000000000002/photo.webp'),
  0::bigint,
  'FR-ACC-007 a user deletes files in their own folder'
);

update storage.objects set name = '00000000-0000-7000-8000-000000000002/stolen.webp'
where name = '00000000-0000-7000-8000-000000000001/photo.webp';
select is(
  (select count(*) from storage.objects where name = '00000000-0000-7000-8000-000000000001/photo.webp'),
  1::bigint,
  'FR-ACC-007 a household member cannot move someone else''s avatar'
);

-- The profile's pointer to the file.

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$
    update public.profiles set avatar_path = '00000000-0000-7000-8000-000000000001/photo.webp'
    where id = '00000000-0000-7000-8000-000000000001'
  $$,
  'FR-ACC-007 a user points their profile at a file in their own folder'
);

select throws_ok(
  $$
    update public.profiles set avatar_path = '00000000-0000-7000-8000-000000000002/photo.webp'
    where id = '00000000-0000-7000-8000-000000000001'
  $$,
  '23514',
  null,
  'FR-ACC-007 avatar_path must point inside the user''s own folder'
);

select lives_ok(
  $$ update public.profiles set avatar_path = null where id = '00000000-0000-7000-8000-000000000001' $$,
  'FR-ACC-007 a user can clear avatar_path'
);

select throws_ok(
  $$
    update public.profiles set avatar_path = '00000000-0000-7000-8000-000000000001x/photo.webp'
    where id = '00000000-0000-7000-8000-000000000001'
  $$,
  '23514',
  null,
  'FR-ACC-007 a folder that only starts with the user''s id is not their folder'
);

select * from finish();
rollback;
