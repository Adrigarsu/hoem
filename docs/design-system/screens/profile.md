# Profile and settings

**Reference:** `profile.html` · **Requirements:** FR-NAV-003, FR-ACC-004, FR-ACC-007, FR-NOTIF-001, NFR-LEG-003 · **Issues:** M1-08, M1-09, M1-10 · **Route:** `/settings`

## Layout — mobile (360 px)

1. Back link (to the previous screen) and `h1` "Profile and settings".
2. Account card (`aria-label="Your account"`): avatar 56 px "L", "Lucía Fernández", "lucia@example.com", IconButton "Edit profile".
3. Section "Household": row "Calle Mayor flat" → "Settings"; row "Switch household".
4. Section "Preferences": rows with current value on the right — Appearance "System", Language "English", Notifications "On".
5. Section "Privacy and data": "Download my data"; "Delete account" (`danger` text and icon).
6. Secondary button, full width: "Sign out".
7. Tab bar (no tab is current).

## Layout — desktop (1440 px)

Sidebar with the profile entry current. Header: `h1` "Profile and settings", "Your account, preferences and households". Cards stacked in a 2-column grid:

- **Account**: avatar with "Change photo", fields "Name" and "Email" ("Change password" link), primary "Save changes".
- **Preferences**: "Appearance" — "Follows your device by default" with a segmented control (`aria-label="Theme"`): System · Light · Dark; "Language" select (English; Español is phase 2 and stays hidden in the MVP); "Notifications" switches: Push notifications — "On this browser", Reminders from notes, Shopping list changes, Budget alerts.
- **Households**: rows with avatar initial, name, "type · role · active", and a "Settings" or "Switch" button (Calle Mayor flat — Shared flat · owner · active; García family — Family · child); "Create a new household".
- **Privacy and data**: "Download my data", "Sign out", "Delete account" (`danger` button).

## Components

Card, Avatar, ListRow with value, SegmentedControl, Select, Switch, Field + Input, Button (primary, secondary, danger), IconButton.

## Texts

`settings.title`, `settings.subtitle`, `settings.account`, `settings.editProfile`, `settings.changePhoto`, `settings.name`, `settings.email`, `settings.changePassword`, `settings.save`, `settings.household`, `settings.householdSettings` "Settings", `settings.switch` "Switch household", `settings.preferences`, `settings.appearance` + `theme.system|light|dark`, `settings.appearanceHelp` "Follows your device by default", `settings.language`, `settings.notifications` + the four switch labels, `settings.households`, `settings.createHousehold`, `settings.privacy` "Privacy and data", `settings.download` "Download my data", `settings.signOut` "Sign out", `settings.delete` "Delete account".

## States

- **Sections not built yet** (M1): Notifications and Download my data open an EmptyState "Coming soon".
- **Saved**: Toast "Changes saved".
- **Delete account**: typed confirmation dialog (type your e-mail); blocked if you are the last owner of a shared household (M1-10).
- **Push blocked**: the push switch is disabled with "Blocked in your browser settings".

## Accessibility

The theme control is a radio group. Destructive actions use text + colour + icon and always confirm.
