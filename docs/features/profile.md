# Profile

Each user's name, photo, theme and language (FR-ACC-007). On phones they are edited on their own
pages, opened from the settings menu; from 768 px, in the cards of `/settings`.

## What it does

- **Name**: 1 to 50 characters, trimmed. It shows at once in the sidebar, the settings menu and the
  greeting on Home.
- **Photo**: a JPEG or PNG of up to 2 MB, sent as soon as it is chosen. A wrong file is explained and
  the current photo stays. Without a photo, or if it fails to load, the avatar shows the initials.
- **Email**: read-only. Changing the email and the password is #80; removing the photo is #79.
- **Theme**: System (the default), Light or Dark. It applies at once and follows the user to every
  device; if saving fails, the previous theme comes back (ADR-018).
- **Language**: English is selected and is the only option until Spanish in phase 2 (ADR-012), so
  nothing is saved yet.

## Privacy rules

- Photos live in the private `avatars` bucket under `{user_id}/{uuid v7}.webp`. Only the owner uploads
  and deletes them; the owner and people who share a household with them can read them. Someone who
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
- Files do not cascade with the account: deleting the account (#23) must remove them too.

## Where it lives

- Code: `src/features/profile/`, the theme in `src/lib/theme/`, the migrations
  `supabase/migrations/*_avatars-storage.sql` and `*_profiles-avatar-path.sql`.
- Tests: `src/features/profile/**/*.test.ts(x)`, `src/lib/theme/theme.test.ts`,
  `supabase/tests/database/avatars.test.sql`, `tests/e2e/profile.spec.ts`.

## Requirements

FR-ACC-007 (profile part).

## Screens

`profile` in `docs/design-system/screens/`, with the decisions of #22 in its `README.md`.
