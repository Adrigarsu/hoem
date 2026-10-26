CREATE TYPE "public"."family_role" AS ENUM('parent', 'child', 'relative');--> statement-breakpoint
CREATE TYPE "public"."household_type" AS ENUM('single', 'family', 'shared_flat', 'other');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"type" "household_type" NOT NULL,
	"currency" char(3) DEFAULT 'EUR' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"family_role" "family_role",
	"can_join_splits" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_household_id_user_id_pk" PRIMARY KEY("household_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "households_created_by_idx" ON "households" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint

-- Everything below is hand-written (docs/architecture.md §7): the tables above get their
-- authorization in the same migration, so they are never deployed without it.

-- Helpers every policy uses (§7.1). They live in a schema the Data API does not expose (only
-- public and graphql_public are), so nobody can call them through /rpc, although signed-in users
-- must be able to execute them for the policies to work. security definer lets them read
-- memberships without going through its own policies, which call them.
create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_member(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where household_id = hh and user_id = (select auth.uid())
  );
$$;

create function private.is_owner(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where household_id = hh and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- Checks the type too, so a family role left behind by a type change never grants anything.
create function private.is_parent(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as m
    join public.households as h on h.id = m.household_id
    where m.household_id = hh
      and m.user_id = (select auth.uid())
      and h.type = 'family'
      and m.family_role = 'parent'
  );
$$;

-- Who invites people and changes their roles: in a family household only parents (FR-HH-006),
-- in the others the owners.
create function private.can_manage_members(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as m
    join public.households as h on h.id = m.household_id
    where m.household_id = hh
      and m.user_id = (select auth.uid())
      and case when h.type = 'family' then m.family_role = 'parent' else m.role = 'owner' end
  );
$$;

revoke execute on function private.is_member(uuid) from public, anon;
revoke execute on function private.is_owner(uuid) from public, anon;
revoke execute on function private.is_parent(uuid) from public, anon;
revoke execute on function private.can_manage_members(uuid) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.is_owner(uuid) to authenticated;
grant execute on function private.is_parent(uuid) to authenticated;
grant execute on function private.can_manage_members(uuid) to authenticated;

-- Privileges are the first wall, RLS the second. Nobody inserts rows directly: creating a
-- household (#16, #19) and joining one (#28) go through security definer functions that write
-- the household and its owner, or the membership, in one step. The type changes only through #19,
-- which also fixes the family roles, and the settings (split rules, privacy options of "other"
-- households) only through the flows that warn and decide who may change them (#30, #31).
revoke all on public.households from anon, authenticated;
grant select, delete on public.households to authenticated;
grant update (name, currency) on public.households to authenticated;

revoke all on public.memberships from anon, authenticated;
grant select, delete on public.memberships to authenticated;
grant update (role, family_role, can_join_splits) on public.memberships to authenticated;

create policy households_select on public.households
  for select to authenticated
  using (private.is_member(id));

create policy households_update on public.households
  for update to authenticated
  using (private.is_owner(id))
  with check (private.is_owner(id));

create policy households_delete on public.households
  for delete to authenticated
  using (private.is_owner(id));

create policy memberships_select on public.memberships
  for select to authenticated
  using (private.is_member(household_id));

-- Managers change members, but ownership stays with the owners: only an owner can touch an
-- owner's row (USING sees the row before the change) or make someone an owner (WITH CHECK sees it
-- after), so a parent who is not an owner cannot promote himself or demote an owner.
create policy memberships_update on public.memberships
  for update to authenticated
  using (
    private.can_manage_members(household_id)
    and (role <> 'owner' or private.is_owner(household_id))
  )
  with check (
    private.can_manage_members(household_id)
    and (role <> 'owner' or private.is_owner(household_id))
  );

-- Managers remove members (owners only by an owner); anyone can leave. The trigger below keeps
-- the last owner in place.
create policy memberships_delete on public.memberships
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or (
      private.can_manage_members(household_id)
      and (role <> 'owner' or private.is_owner(household_id))
    )
  );

-- A household always keeps at least one owner (§7.4). Runs after the change, so handing over
-- ownership works in either order within a statement and promoting before stepping down works
-- across statements. When the household itself is being deleted, its memberships go with it.
-- Deleting the account of a last owner is also refused: #23 decides what happens to the household
-- first.
create function private.ensure_household_keeps_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' then
    return null;
  end if;
  -- Locking the household makes two owners leaving at the same time check one after the other,
  -- instead of each seeing the other still there. No row means the household is being deleted.
  perform 1 from public.households where id = old.household_id for update;
  if not found then
    return null;
  end if;
  if not exists (
    select 1 from public.memberships where household_id = old.household_id and role = 'owner'
  ) then
    raise exception 'a household must keep at least one owner' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

-- family_role is required in family households and refused in the others (§6.3).
create function private.check_family_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_type public.household_type;
begin
  select type into household_type from public.households where id = new.household_id;
  if household_type = 'family' and new.family_role is null then
    raise exception 'a member of a family household needs a family role'
      using errcode = 'check_violation';
  end if;
  if household_type <> 'family' and new.family_role is not null then
    raise exception 'only members of a family household have a family role'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- The same rule seen from the household: when its type changes, the family roles must match the
-- new type by the end of the transaction, so #19 can change the type and then fix the roles.
create function private.check_family_roles_after_type_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.memberships
    where household_id = new.id
      and (case when new.type = 'family' then family_role is null else family_role is not null end)
  ) then
    raise exception 'the family roles do not match the household type'
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

-- Only the triggers call these; Postgres checks the privilege when a trigger is created.
revoke execute on function private.ensure_household_keeps_owner() from public, anon, authenticated;
revoke execute on function private.check_family_role() from public, anon, authenticated;
revoke execute on function private.check_family_roles_after_type_change()
  from public, anon, authenticated;

create trigger memberships_keep_owner
  after update of role or delete on public.memberships
  for each row execute function private.ensure_household_keeps_owner();

create trigger memberships_check_family_role
  before insert or update of household_id, family_role on public.memberships
  for each row execute function private.check_family_role();

create constraint trigger households_family_roles_consistent
  after update of type on public.households
  deferrable initially deferred
  for each row execute function private.check_family_roles_after_type_change();

create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();
