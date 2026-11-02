# Profile and settings

One place for the account, the preferences, the households and sign-out (FR-NAV-003), at
`/settings`. Phones open it from the avatar button at the top right; wider screens from the profile
entry at the bottom of the sidebar, which stays marked current on every page under `/settings`.

## What it does

- **Account**: avatar, name and email, and "Edit profile" (`/settings/account`).
- **Household**: each of the user's households, opening its settings
  (`/settings/household/[id]` until #20 adds the active household), and "Create a new household".
- **Preferences**: Appearance, showing "System" because the theme follows the device until #22,
  and Notifications.
- **Privacy and data**: "Download my data" and "Delete account". Delete account is shown as
  destructive with its text, a bin icon and the `danger` colour.
- **Sign out**: last, full width. It ends the Supabase session and lands on `/sign-in`.
- **Not built yet**: Account and Appearance (#22), Notifications (M5), Download my data
  (NFR-LEG-003) and Delete account (#23) open their own page with an EmptyState "Coming soon" and
  "Back to settings".

## Privacy rules

- The email comes from the user's own verified JWT (`getClaims`), never from another row, so only
  its owner sees it. It is as fresh as the token: when #22 lets people change their email, it decides
  whether to refresh the session or read `getUser()` instead.
- The household list is the user's own memberships, read with their JWT under row-level security.

## Where it lives

- Code: `src/features/settings/` (paths in `domain/sections.ts`, `components/settings-menu.tsx`);
  the page is `src/app/[locale]/(app)/settings/page.tsx`. The sign-out form comes from
  `src/features/auth`, the profile from `src/features/profile`.
- Tests: `src/features/settings/**/*.test.ts(x)`, `tests/e2e/settings.spec.ts`.

## Requirements

FR-NAV-003.

## Screens

`profile` in `docs/design-system/screens/`.
