begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

select matches(
  public.uuid_generate_v7()::text,
  '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  'ADR-003 uuid_generate_v7 returns a version 7, RFC 9562 variant UUID'
);

create temporary table generated_ids (position serial, id uuid);
insert into generated_ids (id) select public.uuid_generate_v7();
select pg_sleep(0.002);
insert into generated_ids (id) select public.uuid_generate_v7();
select pg_sleep(0.002);
insert into generated_ids (id) select public.uuid_generate_v7();

select results_eq(
  'select position from generated_ids order by id',
  'select position from generated_ids order by position',
  'ADR-003 uuid_generate_v7 values sort in creation order'
);

-- The first 48 bits are the Unix time in milliseconds, truncated (RFC 9562), so an id never
-- carries a time later than the moment it was generated. Rounding would fail on about half of
-- these rows.
create temporary table timed_ids as
  select public.uuid_generate_v7() as id, clock_timestamp() as generated_by
  from generate_series(1, 200);

select is_empty(
  $$
    select 1 from timed_ids
    where ('x' || lpad(replace(left(id::text, 13), '-', ''), 16, '0'))::bit(64)::bigint
      not between floor(extract(epoch from generated_by) * 1000)::bigint - 1000
      and floor(extract(epoch from generated_by) * 1000)::bigint
  $$,
  'ADR-003 uuid_generate_v7 embeds the generation time, truncated to milliseconds'
);

create temporary table notes (
  id uuid primary key default public.uuid_generate_v7(),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger notes_set_updated_at
  before update on notes
  for each row execute function public.set_updated_at();

insert into notes (body, created_at, updated_at)
  values ('first', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');
update notes set body = 'second';

select is(
  (select updated_at from notes),
  now(),
  'ADR-003 set_updated_at sets updated_at to the time of the update'
);

select is(
  (select created_at from notes),
  '2026-01-01 00:00:00+00'::timestamptz,
  'ADR-003 set_updated_at keeps created_at unchanged'
);

-- Column defaults run with the privileges of the inserting user, so signed-in users (including
-- anonymous demo sessions, which use the authenticated role) need it; signed-out visitors do not.
select ok(
  not has_function_privilege('anon', 'public.uuid_generate_v7()', 'execute')
    and has_function_privilege('authenticated', 'public.uuid_generate_v7()', 'execute'),
  'ADR-003 only signed-in users can run uuid_generate_v7'
);

select ok(
  not has_function_privilege('anon', 'public.set_updated_at()', 'execute')
    and not has_function_privilege('authenticated', 'public.set_updated_at()', 'execute'),
  'ADR-003 the API roles cannot call set_updated_at directly'
);

select * from finish();
rollback;
