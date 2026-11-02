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
- Members do not see each other's profiles yet, so the family-roles dialog shows "You" and
  "Member 2, 3…" in the order they joined; names come with the member list (#26).

## Where it lives

- Code: `src/features/households/` (domain rules in `domain/`, `service.ts`, `repository.ts`,
  `actions.ts`, components `new-household-form.tsx`, `household-details.tsx`,
  `household-switcher.tsx` and `household-menu.tsx`). Other features read the active household
  with `currentHousehold()`.
- Database: `households`, `memberships` and the functions `create_household` and
  `change_household_type` (`supabase/migrations/20261028190949_household-type.sql`; policies in
  `docs/architecture.md` §7).
- Tests: `supabase/tests/database/household-type.test.sql`, `tests/e2e/household-type.spec.ts`,
  `tests/e2e/household-switcher.spec.ts`.

## Requirements

FR-ACC-003, FR-ACC-004, FR-ACC-009, FR-HH-001, FR-HH-006, FR-HH-007, NFR-LEG-001.

## Screens

`household-switcher`, `new-household`, `household-type` (the Details section and the type-change dialogs) and
`household-settings` in `docs/design-system/screens/`.
