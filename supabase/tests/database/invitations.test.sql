begin;
create extension if not exists pgtap with schema extensions;

select plan(40);

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
-- the households below instead, except Olga, who keeps her "Just me" one.
delete from public.households
where created_by in (
  '00000000-0000-7000-8000-000000000101', '00000000-0000-7000-8000-000000000102',
  '00000000-0000-7000-8000-000000000103', '00000000-0000-7000-8000-000000000104',
  '00000000-0000-7000-8000-000000000201', '00000000-0000-7000-8000-000000000202'
);

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

insert into public.memberships (household_id, user_id, role, family_role)
values
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000101', 'owner', 'parent'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000102', 'member', 'parent'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000103', 'member', 'child'),
  ('00000000-0000-7000-8000-00000000a001', '00000000-0000-7000-8000-000000000104', 'member', 'relative'),
  ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000201', 'owner', null),
  ('00000000-0000-7000-8000-00000000a002', '00000000-0000-7000-8000-000000000202', 'member', null);

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

grant execute on function pg_temp.hint_of(text) to authenticated;

-- Structure.

select results_eq(
  $$
    select p.prosecdef, array_to_string(p.proconfig, ',') collate "default"
    from pg_proc as p
    where p.oid = 'private.create_invitation(uuid, text, public.family_role, bytea)'::regprocedure
  $$,
  $$ values (true, 'search_path=""') $$,
  'NFR-SEC-001 inviting is security definer with a fixed search_path, in the private schema'
);

select is(
  (
    select p.prosecdef
    from pg_proc as p
    where p.oid = 'public.create_invitation(uuid, text, public.family_role, bytea)'::regprocedure
  ),
  false,
  'NFR-SEC-001 the API wrapper runs as the caller'
);

select ok(
  not has_function_privilege(
    'anon', 'public.create_invitation(uuid, text, public.family_role, bytea)', 'execute'
  ),
  'NFR-SEC-001 signed-out visitors cannot invite'
);

select ok(
  not has_table_privilege('authenticated', 'public.invitations', 'insert')
    and not has_table_privilege('authenticated', 'public.invitations', 'update'),
  'FR-ACC-005 nobody writes invitations directly'
);

select ok(
  not has_column_privilege('authenticated', 'public.invitations', 'token_hash', 'select'),
  'FR-ACC-005 nobody reads the token hash through the Data API'
);

-- Signed in as the flat owner.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

select results_eq(
  $$
    select outcome, expires_at = now() + interval '7 days'
    from public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'marta@example.com', null, extensions.digest('token-1', 'sha256')
    )
  $$,
  $$ values ('invited', true) $$,
  'US-ACC-01 an owner invites by e-mail with a link valid for 7 days'
);

reset role;

select is(
  (select token_hash from public.invitations where email = 'marta@example.com'),
  extensions.digest('token-1', 'sha256'),
  'FR-ACC-005 only the SHA-256 of the token is stored'
);

set local role authenticated;

select lives_ok(
  $$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', '  Nuria@Example.COM ', null, extensions.digest('token-2', 'sha256')
    )
  $$,
  'FR-ACC-005 an e-mail with spaces and capitals is accepted'
);

select results_eq(
  $$ select email::text from public.invitations where email = 'NURIA@example.com' $$,
  $$ values ('nuria@example.com') $$,
  'FR-ACC-005 the e-mail is stored trimmed and in lower case, and matched in any case'
);

select results_eq(
  $$
    select outcome
    from public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'MARTA@example.com', null, extensions.digest('token-3', 'sha256')
    )
  $$,
  $$ values ('renewed') $$,
  'FR-ACC-005 inviting a pending address again renews the invitation'
);

reset role;

select results_eq(
  $$ select token_hash from public.invitations where email = 'marta@example.com' $$,
  $$ values (extensions.digest('token-3', 'sha256')) $$,
  'FR-ACC-005 a renewal keeps one invitation, and the earlier link stops working'
);

set local role authenticated;

select results_eq(
  $$
    select id, outcome
    from public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'Marcos@Example.com', null, extensions.digest('token-4', 'sha256')
    )
  $$,
  $$ values (null::uuid, 'already_member') $$,
  'FR-ACC-005 an existing member is not invited'
);

reset role;

select is(
  (
    select request_count
    from private.api_rate_limits
    where user_id = '00000000-0000-7000-8000-000000000201' and bucket = 'invitations'
  ),
  4,
  'NFR-SEC-006 asking about a member counts against the limit, so addresses cannot be guessed freely'
);

set local role authenticated;

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'ines@example.com', 'child', extensions.digest('token-5', 'sha256')
    )
  $$),
  'family_role_not_allowed',
  'FR-HH-006 a family role is refused outside a family'
);

select is(
  (select count(*)::integer from public.invitations),
  2,
  'FR-ACC-005 the owner sees the pending invitations of the household'
);

select throws_ok(
  $$
    insert into public.invitations (household_id, email, token_hash, expires_at)
    values (
      '00000000-0000-7000-8000-00000000a002', 'ines@example.com',
      extensions.digest('token-6', 'sha256'), now() + interval '7 days'
    )
  $$,
  '42501',
  null,
  'FR-ACC-005 an invitation created directly is refused'
);

reset role;

-- The flat owner has used the whole minute.
update private.api_rate_limits set request_count = 60
where user_id = '00000000-0000-7000-8000-000000000201' and bucket = 'invitations';

set local role authenticated;

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'ines@example.com', null, extensions.digest('token-15', 'sha256')
    )
  $$),
  'rate_limited',
  'NFR-SEC-006 more than 60 invitations a minute are refused, even through the Data API'
);

reset role;
delete from private.api_rate_limits where user_id = '00000000-0000-7000-8000-000000000201';
set local role authenticated;

-- Signed in as a flatmate who is not an owner.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000202", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'ines@example.com', null, extensions.digest('token-7', 'sha256')
    )
  $$),
  'not_manager',
  'FR-ACC-005 a member who is not an owner cannot invite'
);

select is_empty(
  $$ select 1 from public.invitations $$,
  'FR-ACC-005 a member who is not an owner sees no invitations'
);

delete from public.invitations;

-- Signed in as the outsider.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000301", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'ines@example.com', null, extensions.digest('token-8', 'sha256')
    )
  $$),
  'not_manager',
  'NFR-SEC-001 an outsider cannot invite to another household'
);

select is_empty(
  $$ select 1 from public.invitations $$,
  'NFR-SEC-001 an outsider sees no invitations of another household'
);

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      (select id from public.households), 'ines@example.com', null, extensions.digest('token-9', 'sha256')
    )
  $$),
  'single_household',
  'FR-ONB-007 a "Just me" household takes no invitations'
);

delete from public.invitations;

reset role;

select is(
  (select count(*)::integer from public.invitations),
  2,
  'FR-ACC-005 someone who cannot invite cannot cancel an invitation either'
);

-- Signed in as a parent who is not the owner.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a001', 'abuela@example.com', null, extensions.digest('token-10', 'sha256')
    )
  $$),
  'family_role_required',
  'FR-HH-006 a parent must choose parent, child or relative'
);

select lives_ok(
  $$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a001', 'abuela@example.com', 'relative', extensions.digest('token-11', 'sha256')
    )
  $$,
  'FR-HH-006 a parent who is not the owner invites in a family'
);

-- Signed in as the child.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000103", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a001', 'amiga@example.com', 'child', extensions.digest('token-12', 'sha256')
    )
  $$),
  'not_manager',
  'FR-HH-006 a child cannot invite'
);

select is_empty(
  $$ select 1 from public.invitations $$,
  'FR-HH-006 a child sees no invitations'
);

delete from public.invitations;

-- Signed in as the relative.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000104", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a001', 'amiga@example.com', 'child', extensions.digest('token-13', 'sha256')
    )
  $$),
  'not_manager',
  'FR-HH-006 a relative cannot invite'
);

select is_empty(
  $$ select 1 from public.invitations $$,
  'FR-HH-006 a relative sees no invitations'
);

delete from public.invitations;

-- Signed in as the owner of the family, also a parent.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000101", "role": "authenticated"}';

select results_eq(
  $$ select email::text, family_role from public.invitations $$,
  $$ values ('abuela@example.com', 'relative'::public.family_role) $$,
  'FR-HH-006 the child and the relative cancel nothing, and every parent sees the family role'
);

select results_eq(
  $$
    select outcome
    from public.create_invitation(
      '00000000-0000-7000-8000-00000000a001', 'abuela@example.com', 'parent', extensions.digest('token-16', 'sha256')
    )
  $$,
  $$ values ('renewed') $$,
  'FR-HH-006 another parent renews the invitation'
);

select results_eq(
  $$ select family_role, invited_by from public.invitations $$,
  $$ values ('parent'::public.family_role, '00000000-0000-7000-8000-000000000101'::uuid) $$,
  'FR-HH-006 a renewal takes the new family role and who sent it last'
);

-- Signed in as the flat owner, cancelling.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

delete from public.invitations where email = 'nuria@example.com';

select results_eq(
  $$ select email::text from public.invitations $$,
  $$ values ('marta@example.com') $$,
  'FR-ACC-005 the owner cancels a pending invitation'
);

reset role;

-- Someone who joined through an earlier invitation and left can be invited again (#28 marks the
-- invitation accepted).
update public.invitations set accepted_at = now() where email = 'marta@example.com';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000201", "role": "authenticated"}';

select results_eq(
  $$
    select outcome
    from public.create_invitation(
      '00000000-0000-7000-8000-00000000a002', 'marta@example.com', null, extensions.digest('token-14', 'sha256')
    )
  $$,
  $$ values ('invited') $$,
  'FR-ACC-005 an accepted invitation does not block a new one'
);

reset role;

-- Deleting the account of the parent who invited keeps the household's invitation (ADR-019: it is
-- shared, not private), without saying who sent it. Pablo sends the invitation again first.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000102", "role": "authenticated"}';
select lives_ok(
  $$
    select public.create_invitation(
      '00000000-0000-7000-8000-00000000a001', 'abuela@example.com', 'relative', extensions.digest('token-17', 'sha256')
    )
  $$,
  'FR-HH-006 the other parent renews it back to relative'
);
reset role;

delete from auth.users where id = '00000000-0000-7000-8000-000000000102';

select results_eq(
  $$ select invited_by from public.invitations where email = 'abuela@example.com' $$,
  $$ values (null::uuid) $$,
  'FR-ACC-007 an invitation outlives the account of who sent it'
);

-- Type changes (FR-HH-007). Written as the update change_household_type makes; the deferred check
-- of the members' roles never runs, because the test rolls back.
insert into public.invitations (household_id, email, token_hash, expires_at)
values (
  '00000000-0000-7000-8000-00000000a002', 'ines@example.com',
  extensions.digest('token-18', 'sha256'), now() + interval '7 days'
);

update public.households set type = 'family' where id = '00000000-0000-7000-8000-00000000a002';

select results_eq(
  $$
    select email::text from public.invitations
    where household_id = '00000000-0000-7000-8000-00000000a002'
  $$,
  $$ values ('marta@example.com') $$,
  'FR-HH-007 becoming a family drops the pending invitations, which have no family role'
);

update public.households set type = 'shared_flat' where id = '00000000-0000-7000-8000-00000000a001';

select results_eq(
  $$
    select email::text, family_role from public.invitations
    where household_id = '00000000-0000-7000-8000-00000000a001'
  $$,
  $$ values ('abuela@example.com', null::public.family_role) $$,
  'FR-HH-007 leaving a family clears the family role of the pending invitations'
);

update public.households set type = 'single' where id = '00000000-0000-7000-8000-00000000a001';

select is_empty(
  $$ select 1 from public.invitations where household_id = '00000000-0000-7000-8000-00000000a001' $$,
  'FR-ONB-007 becoming "Just me" drops the pending invitations'
);

delete from public.households where id = '00000000-0000-7000-8000-00000000a002';

select is_empty(
  $$ select 1 from public.invitations where household_id = '00000000-0000-7000-8000-00000000a002' $$,
  'FR-ACC-005 deleting a household deletes its invitations'
);

select * from finish();
rollback;
