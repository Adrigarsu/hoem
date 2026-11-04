begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

-- Lucía signed up with e-mail and password. Marcos signed up with Google, so Auth stores an empty
-- password for him. Ana's account has no password at all.
insert into auth.users (id, email, encrypted_password)
values
  (
    '00000000-0000-7000-8000-000000000701', 'lucia@example.com',
    extensions.crypt('a-long-password', extensions.gen_salt('bf'))
  ),
  ('00000000-0000-7000-8000-000000000702', 'marcos@example.com', ''),
  ('00000000-0000-7000-8000-000000000703', 'ana@example.com', null);

-- The stable code a statement fails with, read from the HINT the app matches.
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
  has_function_privilege('anon', 'public.own_account_has_password()', 'execute'),
  false,
  'FR-ACC-007 anon cannot execute it'
);

select is(
  has_function_privilege('anon', 'private.own_account_has_password()', 'execute'),
  false,
  'FR-ACC-007 anon cannot execute the function behind it'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.own_account_has_password()'::regprocedure),
  false,
  'FR-ACC-007 the API wrapper runs as the caller'
);

select is(
  (select prosecdef from pg_proc where oid = 'private.own_account_has_password()'::regprocedure),
  true,
  'FR-ACC-007 the function behind it reads auth.users as its owner'
);

select is(
  pg_get_function_result('public.own_account_has_password()'::regprocedure),
  'boolean',
  'FR-ACC-007 it returns only yes or no, never the password hash'
);

-- Answers, each about the caller only.

set local role authenticated;

set local request.jwt.claims = '{"role": "authenticated"}';
select is(
  pg_temp.hint_of($$ select public.own_account_has_password() $$),
  'not_authenticated',
  'FR-ACC-007 without a session it refuses instead of saying no'
);

-- A token stays valid until it expires, even after its account is deleted.
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000799", "role": "authenticated"}';
select is(
  pg_temp.hint_of($$ select public.own_account_has_password() $$),
  'not_authenticated',
  'FR-ACC-007 the token of a deleted account is refused'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000701", "role": "authenticated"}';
select is(
  public.own_account_has_password(), true, 'FR-ACC-007 an e-mail account has a password'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000702", "role": "authenticated"}';
select is(
  public.own_account_has_password(), false, 'FR-ACC-007 a Google account has no password'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000703", "role": "authenticated"}';
select is(
  public.own_account_has_password(), false, 'FR-ACC-007 an account without a password says no'
);

-- Auth gives a Google account no other sign once it sets a password (checked in #80).
reset role;
update auth.users
set encrypted_password = extensions.crypt('another-long-password', extensions.gen_salt('bf'))
where id = '00000000-0000-7000-8000-000000000702';
set local role authenticated;

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000702", "role": "authenticated"}';
select is(
  public.own_account_has_password(), true, 'FR-ACC-007 a Google account that set a password has one'
);

select * from finish();
rollback;
