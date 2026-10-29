-- Custom SQL migration file, put your code below! --
-- Creating a household and changing its type (FR-ACC-009, FR-HH-007). Both write the household and
-- its memberships in one step, which signed-in users cannot do with their own privileges
-- (20261026014430_households.sql), so they go through security definer functions in the private
-- schema. The app calls the public wrappers through /rpc with the user's own JWT; the wrappers run
-- as the caller, so the Data API exposes no security definer function.

-- The rules of each type, the same values as defaultSettings(type) in
-- src/features/households/domain/household-rules.ts. The database chooses them, so nobody can send
-- other rules through /rpc. tests/e2e/household-type.spec.ts creates a household of every type and
-- parses what this stores with the domain schema, so a change on one side without the other fails
-- there.
create function private.default_household_settings(household_type public.household_type)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case household_type
    when 'single' then '{
      "roles": "owner_only",
      "privateShoppingLists": false,
      "splitting": {"mode": "off"},
      "mealPlan": "personal",
      "privateExpenses": "creator",
      "mealSlots": ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
    }'::jsonb
    when 'family' then '{
      "roles": "family",
      "privateShoppingLists": true,
      "splitting": {"mode": "between_parents", "enabled": false},
      "mealPlan": "shared_only",
      "privateExpenses": "creator_and_parents_for_children",
      "mealSlots": ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
    }'::jsonb
    -- "Other" starts like a shared flat; the owner adjusts it later (FR-HH-010).
    else '{
      "roles": "owner_or_member",
      "privateShoppingLists": true,
      "splitting": {"mode": "each_member"},
      "mealPlan": "shared_and_private",
      "privateExpenses": "creator",
      "mealSlots": ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
    }'::jsonb
  end;
$$;

revoke execute on function private.default_household_settings(public.household_type)
  from public, anon, authenticated;

-- The personal household takes its rules from the same place. Nothing in the app calls the old
-- function, so it goes in this migration.
create or replace function private.create_personal_household(user_id uuid, display_name text, locale text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name, type, settings, created_by)
  values (
    private.personal_household_name(display_name, locale),
    'single',
    private.default_household_settings('single'),
    user_id
  )
  returning id into new_household_id;

  insert into public.memberships (household_id, user_id, role)
  values (new_household_id, user_id, 'owner');
end;
$$;

drop function private.single_household_settings();

-- The caller owns the new household; in a family the caller starts as a parent, the only role a
-- lone founder can have (FR-HH-006). Errors carry a stable message the service maps to its codes.
create function private.create_household(name text, household_type public.household_type)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  clean_name text := btrim(name);
  new_household_id uuid;
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  -- Children under 14 join a family through a parent (NFR-LEG-001), never on their own.
  if exists (select 1 from public.profiles where id = caller and is_minor) then
    raise exception 'people under 14 join a household through a parent'
      using errcode = 'insufficient_privilege';
  end if;
  if clean_name is null or char_length(clean_name) not between 1 and 60 then
    raise exception 'a household needs a name of 1 to 60 characters' using errcode = 'check_violation';
  end if;

  insert into public.households (name, type, settings, created_by)
  values (clean_name, household_type, private.default_household_settings(household_type), caller)
  returning id into new_household_id;

  insert into public.memberships (household_id, user_id, role, family_role)
  values (
    new_household_id,
    caller,
    'owner',
    case when household_type = 'family' then 'parent'::public.family_role end
  );
  return new_household_id;
end;
$$;

-- Only an owner changes the type (FR-ACC-009). The household takes the rules of its new type and
-- keeps its meal slots (settingsAfterTypeChange); no other record is touched, so everything created
-- before keeps who can see it (FR-HH-007, ADR-006). family_roles maps every member's user id to
-- parent, child or relative and is read only when the household becomes a family; whoever is
-- owner, at least one member must be a parent, or nobody could manage the family (FR-HH-006).
create function private.change_household_type(
  household_id uuid,
  new_type public.household_type,
  family_roles jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  current_household public.households;
begin
  -- Locking the household makes a member joining at the same time wait (#28), so the roles cover
  -- exactly the members that exist when the change commits.
  select * into current_household from public.households where id = household_id for update;
  if caller is null or not found or not exists (
    select 1 from public.memberships as m
    where m.household_id = current_household.id and m.user_id = caller and m.role = 'owner'
  ) then
    raise exception 'only an owner changes the household type' using errcode = 'insufficient_privilege';
  end if;

  if new_type = current_household.type then
    return;
  end if;

  if new_type = 'single' and exists (
    select 1 from public.memberships as m
    where m.household_id = current_household.id and m.user_id <> caller
  ) then
    raise exception 'a single-person household cannot have other members'
      using errcode = 'check_violation';
  end if;

  -- Children under 14 belong only to family households (NFR-LEG-001).
  if new_type <> 'family' and exists (
    select 1
    from public.memberships as m
    join public.profiles as p on p.id = m.user_id
    where m.household_id = current_household.id and p.is_minor
  ) then
    raise exception 'a household with someone under 14 must stay a family'
      using errcode = 'check_violation';
  end if;

  if new_type = 'family' then
    if jsonb_typeof(family_roles) is distinct from 'object' or exists (
      select 1 from public.memberships as m
      where m.household_id = current_household.id
        and coalesce(family_roles ->> m.user_id::text, '') not in ('parent', 'child', 'relative')
    ) then
      raise exception 'every member needs a family role' using errcode = 'check_violation';
    end if;
    if exists (
      select 1 from jsonb_object_keys(family_roles) as k(user_id)
      where not exists (
        select 1 from public.memberships as m
        where m.household_id = current_household.id and m.user_id::text = k.user_id
      )
    ) then
      raise exception 'family roles were given for people outside the household'
        using errcode = 'check_violation';
    end if;
    if not exists (select 1 from jsonb_each_text(family_roles) as r where r.value = 'parent') then
      raise exception 'a family needs at least one parent' using errcode = 'check_violation';
    end if;
  end if;

  -- The roles must match the type only once both are written: an earlier call in the same
  -- transaction may have made the check immediate (below).
  set constraints public.households_family_roles_consistent deferred;

  -- The type first: the membership trigger accepts family roles only in a family household.
  update public.households
  set type = new_type,
    settings = private.default_household_settings(new_type)
      || jsonb_build_object(
        'mealSlots',
        coalesce(
          current_household.settings -> 'mealSlots',
          private.default_household_settings(new_type) -> 'mealSlots'
        )
      )
  where id = current_household.id;

  update public.memberships as m
  set family_role = case
    when new_type = 'family' then (family_roles ->> m.user_id::text)::public.family_role
  end
  where m.household_id = current_household.id;

  -- Checks the deferred rule that roles match the type now, so a mistake fails this call instead
  -- of the commit.
  set constraints public.households_family_roles_consistent immediate;
end;
$$;

revoke execute on function private.create_household(text, public.household_type) from public, anon;
revoke execute on function private.change_household_type(uuid, public.household_type, jsonb)
  from public, anon;
grant execute on function private.create_household(text, public.household_type) to authenticated;
grant execute on function private.change_household_type(uuid, public.household_type, jsonb)
  to authenticated;

-- The API: thin wrappers that run as the caller.
create function public.create_household(name text, household_type public.household_type)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_household(name, household_type);
$$;

create function public.change_household_type(
  household_id uuid,
  new_type public.household_type,
  family_roles jsonb default '{}'::jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.change_household_type(household_id, new_type, family_roles);
$$;

revoke execute on function public.create_household(text, public.household_type) from public, anon;
revoke execute on function public.change_household_type(uuid, public.household_type, jsonb)
  from public, anon;
grant execute on function public.create_household(text, public.household_type) to authenticated;
grant execute on function public.change_household_type(uuid, public.household_type, jsonb)
  to authenticated;
