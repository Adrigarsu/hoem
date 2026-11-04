-- Case-insensitive e-mails for invitations (FR-ACC-005). Supabase keeps extensions in their own
-- schema, so every use names it.
create extension if not exists citext with schema extensions;--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v7() NOT NULL,
	"household_id" uuid NOT NULL,
	"email" extensions.citext NOT NULL,
	"family_role" "family_role",
	"token_hash" "bytea" NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_household_id_idx" ON "invitations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "invitations_invited_by_idx" ON "invitations" USING btree ("invited_by");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pending_email_key" ON "invitations" USING btree ("household_id","email") WHERE accepted_at is null;--> statement-breakpoint

-- Everything below is hand-written (docs/architecture.md §7): the table gets its authorization in
-- the same migration, so it is never deployed without it.

-- E-mails are stored trimmed and in lower case, so the list shows them as the invitee will type
-- them. The token is 32 random bytes, so its SHA-256 is 32 bytes too.
alter table public.invitations
  add constraint invitations_email_check check (
    email::text = lower(btrim(email::text))
    and length(email::text) <= 254
    and email::text ~ '^[^@[:space:]]+@[^@[:space:]]+$'
  ),
  add constraint invitations_token_hash_check check (octet_length(token_hash) = 32),
  add constraint invitations_expires_at_check check (expires_at > created_at);

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- Privileges are the first wall, RLS the second. Nobody inserts or updates rows directly: inviting
-- goes through private.create_invitation, which checks what a policy cannot (the invitee is not
-- already a member, the family role fits the household type). Accepting (#28) will go through its
-- own security definer function, which checks the token, the expiry and the invitee's e-mail.
revoke all on public.invitations from anon, authenticated;
grant select, delete on public.invitations to authenticated;

-- Only who may invite sees and cancels invitations (FR-HH-006): in a family the parents, in the
-- other types the owners. A child, a relative or a plain member sees none, so the invitees' e-mails
-- stay with the people who sent them.
create policy invitations_select on public.invitations
  for select to authenticated
  using (private.can_manage_members(household_id));

create policy invitations_delete on public.invitations
  for delete to authenticated
  using (private.can_manage_members(household_id));

-- Invites someone to the household, or renews their pending invitation with a new token and seven
-- more days, so the earlier link stops working (FR-ACC-005, FR-HH-006). The app generates the token
-- and sends only its SHA-256 here, so the token is never stored. Security definer to read the
-- members' e-mails in auth.users; it answers only whether the address belongs to a member of this
-- household, which the caller already sees in the member list, and nothing about anyone else.
create function private.create_invitation(
  household_id uuid,
  email text,
  family_role public.family_role,
  token_hash bytea
)
returns table (id uuid, expires_at timestamptz, renewed boolean)
language plpgsql
security definer
set search_path = ''
as $$
-- The parameters share their names with the columns the upsert names; inside the statement they
-- mean the columns, and the parameters are always written create_invitation.<name>.
#variable_conflict use_column
declare
  caller uuid := (select auth.uid());
  normalized text := lower(btrim(create_invitation.email));
  household_type public.household_type;
begin
  if caller is null then
    raise exception 'not authenticated'
      using errcode = 'insufficient_privilege', hint = 'not_authenticated';
  end if;
  -- The same answer for a household that does not exist and one the caller may not manage
  -- (NFR-SEC-001).
  if not private.can_manage_members(create_invitation.household_id) then
    raise exception 'only owners, or parents in a family, invite people'
      using errcode = 'insufficient_privilege', hint = 'not_manager';
  end if;

  select h.type into household_type
  from public.households as h
  where h.id = create_invitation.household_id;
  -- "Just me" has nobody else (FR-ONB-007); the type changes first (FR-HH-007).
  if household_type = 'single' then
    raise exception 'a single-person household takes no invitations'
      using errcode = 'check_violation', hint = 'single_household';
  end if;
  if household_type = 'family' and create_invitation.family_role is null then
    raise exception 'a family invitation needs a family role'
      using errcode = 'check_violation', hint = 'family_role_required';
  end if;
  if household_type <> 'family' and create_invitation.family_role is not null then
    raise exception 'only family households have family roles'
      using errcode = 'check_violation', hint = 'family_role_not_allowed';
  end if;

  -- lower() on both sides: with an empty search_path the citext operators are not found, and the
  -- comparison would silently fall back to a case-sensitive one on text.
  if exists (
    select 1
    from public.memberships as m
    join auth.users as u on u.id = m.user_id
    where m.household_id = create_invitation.household_id and lower(u.email) = normalized
  ) then
    raise exception 'this person is already a member of the household'
      using errcode = 'unique_violation', hint = 'already_member';
  end if;

  -- The unique index on pending invitations decides between inviting and renewing in one
  -- statement, so two requests at the same time never create two rows. xmax is set only on a row
  -- the statement updated, which tells a renewal from a new invitation.
  return query
  insert into public.invitations as i (household_id, email, family_role, token_hash, invited_by, expires_at)
  values (
    create_invitation.household_id,
    normalized::extensions.citext,
    create_invitation.family_role,
    create_invitation.token_hash,
    caller,
    now() + interval '7 days'
  )
  on conflict (household_id, email) where accepted_at is null do update
    set token_hash = excluded.token_hash,
        family_role = excluded.family_role,
        invited_by = excluded.invited_by,
        expires_at = excluded.expires_at
  returning i.id, i.expires_at, i.xmax <> 0;
end;
$$;

revoke execute on function private.create_invitation(uuid, text, public.family_role, bytea)
  from public, anon;
grant execute on function private.create_invitation(uuid, text, public.family_role, bytea)
  to authenticated;

-- The API: a thin wrapper that runs as the caller.
create function public.create_invitation(
  household_id uuid,
  email text,
  family_role public.family_role,
  token_hash bytea
)
returns table (id uuid, expires_at timestamptz, renewed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from private.create_invitation(household_id, email, family_role, token_hash);
$$;

revoke execute on function public.create_invitation(uuid, text, public.family_role, bytea)
  from public, anon;
grant execute on function public.create_invitation(uuid, text, public.family_role, bytea)
  to authenticated;
