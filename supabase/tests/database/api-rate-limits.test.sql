begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Lucía and Marcos each send write requests to the REST API.
insert into auth.users (id, email)
values
  ('00000000-0000-7000-8000-000000000701', 'lucia@example.com'),
  ('00000000-0000-7000-8000-000000000702', 'marcos@example.com');

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
  has_function_privilege('anon', 'public.consume_rate_limit(text, integer, integer)', 'execute'),
  false,
  'NFR-SEC-006 anon cannot execute it'
);

select is(
  has_function_privilege('anon', 'private.consume_rate_limit(text, integer, integer)', 'execute'),
  false,
  'NFR-SEC-006 anon cannot execute the function behind it'
);

select is(
  (
    select prosecdef from pg_proc
    where oid = 'public.consume_rate_limit(text, integer, integer)'::regprocedure
  ),
  false,
  'NFR-SEC-001 the function the Data API exposes runs as the caller'
);

select is(
  (
    select prosecdef from pg_proc
    where oid = 'private.consume_rate_limit(text, integer, integer)'::regprocedure
  ),
  true,
  'NFR-SEC-006 only the function outside the Data API runs with more privileges'
);

select is(
  (select relrowsecurity from pg_class where oid = 'private.api_rate_limits'::regclass),
  true,
  'NFR-SEC-001 the counters have row-level security enabled'
);

select is(
  has_table_privilege('authenticated', 'private.api_rate_limits', 'select'),
  false,
  'NFR-SEC-006 a user cannot read the counters directly'
);

select is(
  has_table_privilege('authenticated', 'private.api_rate_limits', 'insert, update, delete'),
  false,
  'NFR-SEC-006 a user cannot change the counters directly'
);

-- Refusals.

set local role authenticated;
set local request.jwt.claims = '{"role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.consume_rate_limit('api_write', 3, 60) $$),
  'not_authenticated',
  'NFR-SEC-006 it needs a session'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000701", "role": "authenticated"}';

select is(
  pg_temp.hint_of($$ select public.consume_rate_limit('api_write', 0, 60) $$),
  'invalid_limit',
  'NFR-SEC-006 a limit below one is refused'
);

-- Counting, with a limit of 3 per minute so the test stays short.

select public.consume_rate_limit('api_write', 3, 60) from generate_series(1, 2);

select is(
  public.consume_rate_limit('api_write', 3, 60),
  0,
  'NFR-SEC-006 a request within the limit is allowed'
);

select ok(
  public.consume_rate_limit('api_write', 3, 60) between 1 and 60,
  'NFR-SEC-006 the request over the limit gets the seconds left in the window'
);

select is(
  public.consume_rate_limit('demo_session', 3, 60),
  0,
  'NFR-SEC-006 each bucket counts on its own'
);

set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000702", "role": "authenticated"}';

select is(
  public.consume_rate_limit('api_write', 3, 60),
  0,
  'NFR-SEC-006 each user counts on their own'
);

-- A new window starts the count again.

reset role;
update private.api_rate_limits
set window_start = window_start - interval '2 minutes'
where user_id = '00000000-0000-7000-8000-000000000701';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-7000-8000-000000000701", "role": "authenticated"}';

select is(
  public.consume_rate_limit('api_write', 3, 60),
  0,
  'NFR-SEC-006 the limit resets after the window'
);

reset role;

select is(
  (
    select request_count from private.api_rate_limits
    where user_id = '00000000-0000-7000-8000-000000000701' and bucket = 'api_write'
  ),
  1,
  'NFR-SEC-006 the new window counts from one'
);

-- Deleting an account removes its counters (ADR-019).

delete from auth.users where id = '00000000-0000-7000-8000-000000000701';

select is_empty(
  $$ select 1 from private.api_rate_limits where user_id = '00000000-0000-7000-8000-000000000701' $$,
  'FR-ACC-007 deleting an account removes its counters'
);

select * from finish();
rollback;
