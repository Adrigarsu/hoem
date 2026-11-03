# Account

Deleting your own account (FR-ACC-007, NFR-LEG-003). Editing the profile is in
`docs/features/profile.md`; exporting data (NFR-LEG-003) comes in M7.

## What it does

"Delete account" under Privacy and data, in `/settings`, opens a dialog at every width.

- **Typed confirmation**: the dialog explains what goes and what stays, and asks for the user's e-mail.
  Case and surrounding spaces do not matter. It has no undo (ADR-009).
- **Deleting**: removes the user's photos, then the account, its profile and memberships, and the
  households the user was alone in, with their data. Records the user shared stay in their households.
  The user lands on `/sign-in`, which says "Your account has been deleted."
- **Last owner of a household with other members**: the dialog shows only "Make someone else owner
  first" with links to those households, and nothing is deleted. Choosing a new owner comes with #26.
- **If it fails**: the dialog says so, keeps what was typed and the user can retry. The photo may
  already be gone: the avatar then shows the initials.

## Privacy rules

- Everything runs with the user's own JWT, never the service-role key (ADR-004). The database function
  `delete_own_account` takes no user id, so it can only delete the caller (ADR-019).
- The order protects the user: e-mail and last-owner checks, then photos, then the account. If removing
  a photo fails, the account stays, because nobody could remove a photo after the account is gone. The
  function also refuses while files remain (`files_left`), so calling the API directly cannot leave one
  behind.
- Typing the e-mail prevents accidents, not attacks: someone holding an open session could type it.
- Other devices keep a valid token for up to an hour. It reads nothing and cannot store a photo, but
  those devices show an error page until it expires.
- A table or bucket with private records must delete them with the account: a foreign key cannot tell
  private rows from shared ones, and does not reach Storage (`AGENTS.md`, ADR-019).

## Where it lives

- Code: `src/features/account/` (`domain/account-deletion.ts`, `service.ts`, `repository.ts`,
  `actions.ts`, `components/delete-account.tsx`). The settings page passes the dialog to the menu and
  the cards. The notice is in `src/features/auth/components/sign-in-form.tsx`.
- Database: `supabase/migrations/20261103150733_delete-own-account.sql`.
- Tests: `src/features/account/**/*.test.ts(x)`, `supabase/tests/database/delete-own-account.test.sql`,
  `tests/e2e/delete-account.spec.ts`. The last-owner dialog has no E2E test yet: the app cannot create a
  household with several members until #27/#28.

## Requirements

FR-ACC-007 (deletion part), NFR-LEG-003 (deletion part).

## Screens

`profile` (dialog) and `sign-in` (notice) in `docs/design-system/screens/`.
