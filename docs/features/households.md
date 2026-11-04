# Households

A household is where every record lives (SRS §6). Each one has a **type** (single person, family,
shared flat or other) that sets its rules: roles, who sees private expenses, meal plans, private
shopping lists and splitting (SRS §3.7).

## What it does

- **Personal household on sign-up** (FR-ACC-003): every account gets a "single" household named
  "<name>'s home", which it owns.
- **Create a household** (FR-ACC-009): from Settings → "Create a new household" (`/households/new`;
  also the last item of the switcher). Name (1–60 characters) and type; the creator is its owner, and a
  parent when it is a family. People under 14 cannot create one (NFR-LEG-001).
- **Switch the active household** (FR-ACC-004): the household button in the Home header on phones
  and under the logo in the sidebar on wider screens opens the list of the user's households, with
  type and members and the active one checked. Choosing one makes it active on every screen; the
  choice stays after a reload and a new sign-in on the same device.
- **Rename it and change its type** (FR-ACC-009, FR-HH-007): household settings
  (`/settings/household/[id]` until #20 adds the active household), "Details" section. Only owners;
  members see both read-only with "Only owners can change this."
  - Choosing another type opens a warning: the new rules only apply to records created from now on.
  - To become a family, every member needs a family role (parent, child or relative) and at least
    one must be a parent. The owner is pre-set as a parent and can change it: being an owner and
    being a parent are separate.
  - "Just me" is refused while others belong; leaving "family" is refused while someone is under
    14 (ages stay private: only the database knows them).
  - The household takes the rules of its new type and keeps its meal slots. Leaving "family" clears
    the family roles.
- **When an account is deleted** (FR-ACC-007, ADR-019): the households the user was alone in go with
  it. Someone who is the last owner of a household with other members cannot delete their account,
  or leave, until someone else is an owner (`last_owner`); nor can the last parent of such a family,
  until someone else is a parent (`last_parent`). See `docs/features/account.md`.
- **Members and roles** (FR-ACC-006, FR-HH-006, FR-HH-008): household settings, "Members"
  section. Every member sees every member's name, photo and role (plus parent, child or relative in
  a family), in joining order. "Options for {name}" opens a dialog with only what the user may do:
  - Owners manage members outside a family; in a family, parents set parent, child or relative and
    remove members. Only an owner changes or removes an owner.
  - In every type, an owner makes someone an owner or stops being one (`set_member_role`), parent
    or not, so an owner who is a relative can always hand over ownership.
  - The only owner is asked to make someone else owner first (`last_owner`); the last parent of a
    family, to make someone else a parent first (`last_parent`). This also blocks leaving and
    deleting the account while others belong.
  - Removing hides the member at once with a 5-second undo (ADR-009); closing the tab sends it as a
    keepalive `DELETE /api/v1/households/{id}/members/{userId}` (ADR-020). Removing yourself is
    leaving, a separate issue.
  - That route counts against the 60 write requests per minute per user and answers 429 with
    `Retry-After` over it (NFR-SEC-006, ADR-021).

## Privacy rules

- The active household lives in the HttpOnly `hoem-household` cookie, but only as a preference: it
  is picked among the households row-level security lets the user read, so a household they left
  is never listed nor active, and the first one takes its place (ADR-017). Switching to a household
  the user does not belong to is refused as not found.

- A type change rewrites nothing but the household's type and rules and the members' family roles:
  existing private records keep who can see them, because visibility is fixed when each record is
  written (ADR-006). Expense policy tests in M4 prove it again.
- The database chooses each type's rules (`private.default_household_settings`); the client never
  sends them.
- Members see each other's name and photo only, through `household_members`: the rest of a profile
  (age, language, time zone) stays readable only by its owner. The photos are signed URLs that
  expire after 15 minutes. A member without a profile shows as "Member without a name" (and as
  "Member 2, 3…" in the family-roles dialog).
- Removed members lose access at once: row-level security reads the membership on every query.

## Where it lives

- Code: `src/features/households/` (domain rules in `domain/`, `service.ts`, `repository.ts`,
  `actions.ts`, components `new-household-form.tsx`, `household-details.tsx`,
  `household-members.tsx`, `household-switcher.tsx` and `household-menu.tsx`; member rules in
  `domain/member-rules.ts`; REST route `src/app/api/v1/households/[id]/members/[userId]/route.ts`). Other features read the active household
  with `currentHousehold()`.
- Database: `households`, `memberships` and the functions `create_household` and
  `change_household_type` (`supabase/migrations/20261028190949_household-type.sql`),
  `household_members`, `set_member_role` and the last-parent trigger
  (`supabase/migrations/20261104175018_household-members.sql`); policies in
  `docs/architecture.md` §7.
- Tests: `supabase/tests/database/household-type.test.sql`,
  `supabase/tests/database/household-members.test.sql`, `tests/e2e/household-type.spec.ts`,
  `tests/e2e/household-members.spec.ts`, `tests/e2e/household-switcher.spec.ts`. Households with
  several people need invitations (#27, #28), so the end-to-end test covers one account; the rules
  between members are tested with every role in pgTAP and in the unit tests.

## Requirements

FR-ACC-003, FR-ACC-004, FR-ACC-006, FR-ACC-009, FR-HH-001, FR-HH-006, FR-HH-007, FR-HH-008,
NFR-LEG-001.

## Screens

`household-switcher`, `new-household`, `household-type` (the Details section and the type-change dialogs) and
`household-settings` (Members) in `docs/design-system/screens/`.
