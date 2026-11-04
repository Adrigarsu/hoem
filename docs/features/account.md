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
- **Last owner or last parent of a household with other members**: the dialog shows only "Make
  someone else owner first", "Make someone else a parent first" (the last parent of a family), or
  "Hand over your place first" when both apply, with links to those households, and nothing is
  deleted. Choosing a new owner or parent comes with #26.
- **While deleting**: Cancel and Escape do nothing, because the server is already deleting the account.
  If the browser closes the dialog anyway (Chromium does on a second Escape), it opens again.
  Turning a phone with the dialog open keeps it open with what was typed: there is one dialog for the
  whole page, outside the blocks of each width.
- **If it fails**: the dialog says so, keeps what was typed and the user can retry. The photo may
  already be gone: the avatar then shows the initials.

## Privacy rules

- Everything runs with the user's own JWT, never the service-role key (ADR-004). The database function
  `delete_own_account` takes no user id, so it can only delete the caller (ADR-019).
- The order protects the user: e-mail, last-owner and last-parent checks, then photos, then the account. If removing
  a photo fails, the account stays, because nobody could remove a photo after the account is gone. The
  function also refuses while files remain (`files_left`), so calling the API directly cannot leave one
  behind.
- The typed e-mail is checked against Auth (`getUser`), the address the database compares, not
  against the token's claim, which keeps an old address until the token is renewed. A wrong address
  therefore never removes the photo first.
- Typing the e-mail prevents accidents, not attacks: someone holding an open session could type it.
- Other devices keep a valid token for up to an hour. It reads nothing and cannot store a photo, but
  those devices show an error page until it expires. The same happens on this device if clearing the
  session fails.
- After the redirect, without a reload, the fields of `/settings` stay hidden in the DOM with the
  deleted account's name and e-mail, until the page is reloaded.
- Anyone can open `/sign-in?deleted=1` and see the notice: it is a fixed text and reveals nothing.
- A table or bucket with private records must delete them with the account: a foreign key cannot tell
  private rows from shared ones, and does not reach Storage (`AGENTS.md`, ADR-019).

## Where it lives

- Code: `src/features/account/` (`domain/account-deletion.ts`, `service.ts`, `repository.ts`,
  `actions.ts`, `components/delete-account.tsx`). The settings page wraps the menu and the cards in
  `DeleteAccountProvider`, which holds the one dialog, and each block gets a `DeleteAccountButton`. The notice is in `src/features/auth/components/sign-in-form.tsx`.
- Database: `supabase/migrations/20261103150733_delete-own-account.sql`.
- Tests: `src/features/account/**/*.test.ts(x)`, `supabase/tests/database/delete-own-account.test.sql`,
  `tests/e2e/delete-account.spec.ts`. The last-owner and last-parent dialogs have no E2E test yet: the app cannot create a
  household with several members until #27/#28.

## Requirements

FR-ACC-007 (deletion part), NFR-LEG-003 (deletion part).

## Screens

`profile` (dialog) and `sign-in` (notice) in `docs/design-system/screens/`.
