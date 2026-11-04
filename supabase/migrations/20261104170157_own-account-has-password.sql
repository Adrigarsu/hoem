-- Whether the caller's account has a password (FR-ACC-007, #80). Auth gives no sign of it: an
-- account created with Google keeps the same identities and providers after setting a password. The
-- app needs it to ask for the current password before changing it, and to offer "Set a password"
-- to accounts that have none. Only auth.users knows, so this reads it as its owner, about the
-- caller only, and returns nothing but yes or no.
create function private.own_account_has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select encrypted_password is not null and encrypted_password <> ''
      from auth.users
      where id = (select auth.uid())
    ),
    false
  );
$$;

revoke execute on function private.own_account_has_password() from public, anon;
grant execute on function private.own_account_has_password() to authenticated;

-- The API: a thin wrapper that runs as the caller.
create function public.own_account_has_password()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.own_account_has_password();
$$;

revoke execute on function public.own_account_has_password() from public, anon;
grant execute on function public.own_account_has_password() to authenticated;
