-- Rate limits for the REST API (NFR-SEC-006, ADR-021): 60 write requests per minute per user,
-- shared by every serverless instance. A fixed window per user and bucket, so each user has one row
-- per bucket and nothing needs cleaning up. Only the function below reads or writes the table, with
-- the caller's own JWT: the request path never needs the service-role key (ADR-004).

create table private.api_rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null check (bucket ~ '^[a-z_]{1,32}$'),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

-- No policies: nobody reads or writes the table directly, only the security definer function.
alter table private.api_rate_limits enable row level security;
revoke all on table private.api_rate_limits from public, anon, authenticated;

-- Counts one request of the caller in the bucket. Returns 0 when it is allowed, otherwise the
-- seconds until the window ends, for the Retry-After header. It takes no user id, so a caller can
-- only ever spend their own allowance.
create function private.consume_rate_limit(
  bucket text,
  max_requests integer,
  window_seconds integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  window_length interval := make_interval(secs => window_seconds);
  current_window timestamptz := date_bin(window_length, now(), timestamptz '2000-01-01 00:00:00+00');
  counted integer;
begin
  if caller is null then
    raise exception 'not authenticated'
      using errcode = 'insufficient_privilege', hint = 'not_authenticated';
  end if;
  if max_requests < 1 or window_seconds < 1 then
    raise exception 'the limit and the window must be positive'
      using errcode = 'check_violation', hint = 'invalid_limit';
  end if;

  -- One statement, so two requests at the same time are counted one after the other.
  insert into private.api_rate_limits as l (user_id, bucket, window_start, request_count)
  values (caller, consume_rate_limit.bucket, current_window, 1)
  on conflict on constraint api_rate_limits_pkey do update
    set window_start = excluded.window_start,
        request_count = case
          when l.window_start < excluded.window_start then 1
          else l.request_count + 1
        end
  returning request_count into counted;

  if counted <= max_requests then
    return 0;
  end if;
  return greatest(1, ceil(extract(epoch from (current_window + window_length - now())))::integer);
end;
$$;

revoke execute on function private.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function private.consume_rate_limit(text, integer, integer) to authenticated;

-- The API: a thin wrapper that runs as the caller.
create function public.consume_rate_limit(bucket text, max_requests integer, window_seconds integer)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.consume_rate_limit(bucket, max_requests, window_seconds);
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;
