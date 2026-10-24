-- Lightweight database read for the keep-alive workflow: free Supabase projects pause after a
-- week without activity, and a request that only reaches the API gateway does not count.
create function public.ping()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select 1;
$$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
