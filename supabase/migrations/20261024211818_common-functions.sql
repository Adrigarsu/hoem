-- Helpers every table uses (docs/architecture.md §6.1).

-- PostgreSQL 17 has no built-in UUID v7 (uuidv7() arrives in 18). Layout from RFC 9562: 48 bits of
-- Unix time in milliseconds, then the version, random bits, the variant and more random bits, so
-- ids sort roughly by creation time and keep B-tree inserts local.
create function public.uuid_generate_v7()
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  value bytea;
begin
  value := overlay(
    uuid_send(gen_random_uuid())
    placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
    from 1 for 6
  );
  -- Version 7 in the high nibble of byte 6. Byte 8 already carries the RFC variant (10xx),
  -- because gen_random_uuid() returns a version 4 UUID.
  value := set_byte(value, 6, (get_byte(value, 6) & 15) | 112);
  return encode(value, 'hex')::uuid;
end;
$$;

-- Column defaults run with the privileges of the inserting user, so signed-in users need it.
revoke execute on function public.uuid_generate_v7() from public, anon;
grant execute on function public.uuid_generate_v7() to authenticated, service_role;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Postgres checks this privilege when a trigger is created, not when it fires.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
