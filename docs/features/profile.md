# Profile

Each user's name, photo, theme and language (FR-ACC-007). On phones they are edited on their own
pages, opened from the settings menu; from 768 px, in the cards of `/settings`.

## What it does

- **Name**: 1 to 50 characters, trimmed. It shows at once in the sidebar, the settings menu and the
  greeting on Home.
- **Photo**: a JPEG or PNG of up to 2 MB, sent as soon as it is chosen. A wrong file is explained and
  the current photo stays. Without a photo, or if it fails to load, the avatar shows the initials.
- **Remove photo**: next to "Change photo" while there is one. The initials replace it at once in
  every avatar of the user, with "Undo" for 5 seconds (paused while the pointer or focus is on the
  message); then the profile's `avatar_path` is cleared and every file in the user's folder is
  deleted (ADR-009). If that fails, the photo comes back and the message says so.
- **Email**: read-only until #80, which adds changing the email and the password.
- **Theme**: System (the default), Light or Dark. It applies at once and follows the user to every
  device; if saving fails, the previous theme comes back (ADR-018).
- **Language**: English is selected and is the only option until Spanish in phase 2 (ADR-012), so
  nothing is saved yet.

## Privacy rules

- Photos live in the private `avatars` bucket under `{user_id}/{uuid v7}.webp`. Only the owner uploads
  and deletes them, and uploading needs a profile, so a token that outlives a deleted account cannot
  store a photo; the owner and people who share a household with them can read them. Someone who
  leaves the household loses access (`supabase/tests/database/avatars.test.sql`).
- The server re-encodes every photo with `sharp` to a 256×256 WebP. The original is never stored, so
  the location in a phone photo's metadata never reaches other members.
- The app shows photos through signed URLs that last 15 minutes. Anyone holding one can load the file
  until it expires, so someone who leaves a household could still use one issued before.
- Changing the photo removes every other file in the user's folder, so one that a failed delete left
  behind goes with the next change. A failed delete is logged, not shown to the user.
- `<img>` rather than `next/image`: the optimizer would keep a private photo in a shared cache.
- The app signs URLs and uploads with the user's own JWT, never the service-role key. There is no
  Supabase client in the browser (ADR-016), so uploads go through a Server Action, whose body limit
  is 3 MB (`next.config.ts`).
- Members cannot read each other's names or `avatar_path` until #26 opens that policy; the storage
  policy that lets them read the photo is already in place.
- Removing clears `avatar_path` before deleting the files, so the profile never points at a missing
  file, and a second request (another tab, a repeated `pagehide`) does nothing. It reads the profile
  again before deleting, so a photo another tab uploaded meanwhile is kept, and this tab waits for a
  removal already sent before uploading a new photo.
- Signing out within the 5 seconds sends the removal first: once the session ends, it would be
  refused.
- During the 5-second undo the file still exists and members can still load it, as ADR-009 intends.
  Closing the tab sends the removal on `pagehide`, best effort: a browser may cut that request off,
  and then the photo is still there on the next visit.
- Whether an account has a password comes from `own_account_has_password()` (#80): Supabase Auth
  gives no sign of it once a Google account sets one. It answers only about the caller, only yes or
  no, and refuses without a session or for a deleted account, so the app never offers "Set a
  password" without asking for the current one by mistake
  (`supabase/tests/database/own-account-has-password.test.sql`).
- Files do not cascade with the account: deleting the account (#23) must remove them too.

## Where it lives

- Code: `src/features/profile/` (`own-photo.tsx` holds the removal for the whole app), the Toast and
  `useUndoTimer` in `src/design-system/`, the theme in `src/lib/theme/`, the migrations
  `supabase/migrations/*_avatars-storage.sql` and `*_profiles-avatar-path.sql`.
- Tests: `src/features/profile/**/*.test.ts(x)`, `src/lib/theme/theme.test.ts`,
  `supabase/tests/database/avatars.test.sql`, `tests/e2e/profile.spec.ts`.

## Requirements

FR-ACC-007 (profile part).

## Screens

`profile` in `docs/design-system/screens/`, with the decisions of #22 in its `README.md`.
