-- Custom SQL migration file, put your code below! --
-- Members and roles (FR-ACC-006, FR-HH-006, FR-HH-008). Members see each other's name and photo,
-- owners hand over ownership in every household type, and a family never loses its last parent.
-- Family roles and removing members need nothing new: the memberships_update and memberships_delete
-- policies already decide who may do it (20261026014430_households.sql).

-- The member list with each member's name and photo, in the order they joined, so a list never
-- reshuffles between visits. Profiles stay readable only by their owner (profiles_select_own): this
-- returns the two columns another member may see and nothing else, never is_minor, the locale or
-- the time zone. Security definer to read those profiles; someone outside the household gets no
-- rows, the same answer as for a household that does not exist (NFR-SEC-001). A member whose profile
-- is missing is still listed, without a name, so nobody vanishes from their own household.
create function private.household_members(hh uuid)
returns table (
  user_id uuid,
  role public.member_role,
  family_role public.family_role,
  display_name text,
  avatar_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, m.role, m.family_role, p.display_name, p.avatar_path
  from public.memberships as m
  left join public.profiles as p on p.id = m.user_id
  where m.household_id = hh and private.is_member(hh)
  order by m.created_at, m.user_id;
$$;

revoke execute on function private.household_members(uuid) from public, anon;
grant execute on function private.household_members(uuid) to authenticated;

-- The API: a thin wrapper that runs as the caller.
create function public.household_members(household_id uuid)
returns table (
  user_id uuid,
  role public.member_role,
  family_role public.family_role,
  display_name text,
  avatar_path text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.household_members(household_id);
$$;

revoke execute on function public.household_members(uuid) from public, anon;
grant execute on function public.household_members(uuid) to authenticated;

-- Owners make someone an owner, or stop being one, in every household type (FR-ACC-006). The
-- memberships_update policy also needs can_manage_members, which in a family means being a parent
-- (FR-HH-006): an owner who is a relative could then never hand over ownership, and as the last owner
-- could never leave nor delete their account. This changes the role only, never the family role, so
-- parents still decide those. ensure_household_keeps_owner keeps the last owner in place.
create function private.set_member_role(
  household_id uuid,
  member_id uuid,
  new_role public.member_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null or not exists (
    select 1 from public.memberships as m
    where m.household_id = set_member_role.household_id and m.user_id = caller and m.role = 'owner'
  ) then
    raise exception 'only an owner changes who is an owner'
      using errcode = 'insufficient_privilege', hint = 'not_owner';
  end if;

  update public.memberships as m
  set role = new_role
  where m.household_id = set_member_role.household_id and m.user_id = member_id;
  if not found then
    raise exception 'this person is not a member of the household'
      using errcode = 'no_data_found', hint = 'not_member';
  end if;
end;
$$;

revoke execute on function private.set_member_role(uuid, uuid, public.member_role)
  from public, anon;
grant execute on function private.set_member_role(uuid, uuid, public.member_role)
  to authenticated;

-- The API: a thin wrapper that runs as the caller.
create function public.set_member_role(
  household_id uuid,
  member_id uuid,
  new_role public.member_role
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_member_role(household_id, member_id, new_role);
$$;

revoke execute on function public.set_member_role(uuid, uuid, public.member_role)
  from public, anon;
grant execute on function public.set_member_role(uuid, uuid, public.member_role)
  to authenticated;

-- A family always keeps at least one parent, or nobody could invite people or change roles
-- (private.can_manage_members, FR-HH-006) and a child would be left without one (NFR-LEG-001).
-- The same shape as private.ensure_household_keeps_owner: it runs after the change, so naming a new
-- parent before stepping down works, and it covers leaving, being removed, a role change and
-- deleting the account.
create function private.ensure_family_keeps_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_type public.household_type;
begin
  if old.family_role is distinct from 'parent' then
    return null;
  end if;
  -- Locking the household makes two parents leaving at the same time check one after the other.
  -- No row means the household is being deleted.
  select type into household_type from public.households where id = old.household_id for update;
  if not found then
    return null;
  end if;
  -- A type change away from family clears every family role (private.change_household_type).
  if household_type <> 'family' then
    return null;
  end if;
  if exists (
    select 1 from public.memberships
    where household_id = old.household_id and family_role = 'parent'
  ) then
    return null;
  end if;
  -- The last account of the household is being deleted: ensure_household_keeps_owner deletes the
  -- household with it, so there is nobody left to manage.
  if not exists (select 1 from auth.users where id = old.user_id)
    and not exists (
      select 1
      from public.memberships as m
      join auth.users as u on u.id = m.user_id
      where m.household_id = old.household_id
    ) then
    return null;
  end if;
  raise exception 'a family must keep at least one parent'
    using errcode = 'check_violation', hint = 'last_parent';
end;
$$;

-- Only the trigger calls it; Postgres checks the privilege when a trigger is created.
revoke execute on function private.ensure_family_keeps_parent() from public, anon, authenticated;

create trigger memberships_keep_parent
  after update of family_role or delete on public.memberships
  for each row execute function private.ensure_family_keeps_parent();
