# HØEM screens

Reference designs for every screen of the MVP. Each screen has two files:

- `<screen>.html` — standalone reference: light and dark theme, mobile (360 px) and, where the layout differs, desktop (1440 px). Open it in a browser.
- `<screen>.md` — the spec: layout order, components, texts, states and mobile/desktop differences.

The HTML uses the token names from `docs/design-system/tokens.json` as CSS custom properties (`var(--bg)`, `var(--space-4)`, `var(--radius-md)`…). Colours that are not tokens appear only in the Google logo. The markup is a reference for structure and spacing, **not production code**: build each screen from the design-system components in `src/design-system/`.

## Screen list

| #   | Screen                  | File                 | Route (proposed)                | Mobile                    | Desktop         | Milestone |
| --- | ----------------------- | -------------------- | ------------------------------- | ------------------------- | --------------- | --------- |
| 1   | Launch screen           | `splash`             | — (while the session loads)     | ✓                         | same layout     | M1a       |
| 2   | Sign in                 | `sign-in`            | `/sign-in`                      | ✓ + 2 error states        | ✓ + error       | M0        |
| 3   | Create account          | `sign-up`            | `/sign-up`                      | ✓                         | ✓ (derived)     | M0        |
| 4   | Check your inbox        | `check-your-inbox`   | `/check-your-inbox`             | ✓ + resent state          | ✓               | M0 (new)  |
| 4a  | Forgot password         | `forgot-password`    | `/forgot-password`              | ✓ + states (derived, #24) | ✓               | M1a       |
| 4b  | Set a new password      | `reset-password`     | `/auth/reset-password`          | ✓ + states (derived, #24) | ✓               | M1a       |
| 5   | Setup guide: welcome    | `setup-welcome`      | `/setup`                        | ✓                         | centred column  | M1b       |
| 6   | Setup step 1: household | `setup-household`    | `/setup/household`              | ✓                         | centred column  | M1b       |
| 7   | Setup step 2: meals     | `setup-meals`        | `/setup/meals`                  | ✓                         | centred column  | M1b       |
| 8   | Setup step 3: money     | `setup-money`        | `/setup/money`                  | ✓                         | centred column  | M1b       |
| 9   | Setup step 4: people    | `setup-people`       | `/setup/people`                 | ✓                         | centred column  | M1b       |
| 10  | Home                    | `home`               | `/`                             | ✓ + loading + demo        | ✓               | M1a / M6  |
| 11  | Switch household        | `household-switcher` | sheet over any screen           | ✓                         | menu            | M1a       |
| 12  | Notifications           | `notifications`      | `/notifications`                | ✓                         | not designed    | M5        |
| 13  | Planner                 | `planner`            | `/planner`                      | ✓                         | ✓ (with editor) | M5        |
| 14  | New / edit note         | `note-edit`          | `/planner/new`, `/planner/[id]` | ✓                         | inside Planner  | M5        |
| 15  | Meals                   | `meals`              | `/meals`                        | ✓                         | ✓               | M3        |
| 16  | Recipe                  | `recipe`             | `/meals/recipes/[id]`           | ✓                         | not designed    | M3        |
| 17  | Edit recipe             | `recipe-edit`        | `/meals/recipes/[id]/edit`      | ✓                         | not designed    | M3        |
| 18  | Shopping                | `shopping`           | `/shopping`                     | ✓ + empty + offline/error | ✓               | M2        |
| 19  | Expenses                | `expenses`           | `/expenses`                     | ✓ + family view           | ✓               | M4        |
| 20  | Add expense             | `add-expense`        | sheet / dialog                  | ✓ + child view            | dialog          | M4        |
| 21  | Profile and settings    | `profile`            | `/settings`                     | ✓                         | ✓               | M1a       |
| 22  | Household settings      | `household-settings` | `/settings/household`           | ✓                         | not designed    | M1a / M1b |
| 23  | New household           | `new-household`      | `/households/new`               | ✓ + error                 | centred column  | M1a       |
| 24  | Household type          | `household-type`     | part of household settings      | ✓ + dialogs               | ✓ (derived)     | M1a       |

"Not designed" on desktop: use the mobile layout inside the desktop shell (sidebar + content column, max width 720 px) until a desktop design exists. "Derived" and "new" screens were built for this hand-off from existing pieces; review them before building.

## Rules that apply to every screen

- **Shell.** Mobile: bottom tab bar (Shopping, Expenses, **Home**, Planner, Meals) and the avatar button fixed top right for Profile and settings. Desktop (≥ 768 px): left sidebar (logo, household switcher, Home, Planner, Meals, Shopping, Expenses, profile entry at the bottom).
- **Themes.** Light by default; dark follows `prefers-color-scheme` unless the user picks one in Appearance. Only tokens change between themes.
- **Text.** Every string comes from `messages/en.json`. Suggested key pattern: `<screen>.<element>`, e.g. `signIn.title`.
- **Accessibility.** One `h1` per screen, landmarks (`header`, `nav`, `main`), visible focus, 44 × 44 px targets, icon-only buttons with an accessible name and a tooltip, colour never the only signal, `aria-live` for async results.
- **States.** Every data screen needs: loading (skeletons in the final layout), empty, error (inline, with retry) and offline. When a state is not drawn, follow the Shopping and Home examples.
- **Example data.** Lucía (you) and Marcos in "Calle Mayor flat"; the García family for family households.

## Decisions on the hand-off

Taken when the screens entered the repository (#57). Where they differ from a screen, the
decision wins and the screen's spec says so.

| Topic             | Decision                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-up password  | Two fields, "Password" and "Repeat the password", each with a show/hide toggle (decided in #13).                                                                                         |
| Check your inbox  | Its own route, `/check-your-inbox`. The address it shows travels in a short-lived HttpOnly cookie, never in the URL, so it stays out of history and logs.                                |
| "Email"           | Written "Email" in every text, as in the screens.                                                                                                                                        |
| Verification link | Expires after 1 hour, as Supabase is configured; texts say "1 hour".                                                                                                                     |
| Submitting        | The button shows a spinner and "Signing in…"/"Creating account…", stays focusable and is announced as busy (`aria-busy`, `aria-disabled`); it is never `disabled`, so focus is not lost. |
| Google and demo   | "Continue with Google" and the demo card appear only when FR-ACC-002 (#25) and the demo (M6) exist.                                                                                      |
| Age and terms     | The "14 or older" and terms checkboxes come with the sign-up redesign (#58), together with the terms and privacy pages they link to.                                                     |
| Logo              | The `Logo` component draws the vector wordmark from `assets/logos/` with token colours, instead of setting it in Montserrat (#58). No logo font is loaded.                               |
| Message keys      | Keys keep the app's namespaces (`Auth.signIn.title`), not the `signIn.title` pattern suggested above.                                                                                    |

### Decisions taken building the auth screens (#58)

| Topic              | Decision                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop split      | The brand panel appears from `bp-lg` (1024 px), not 960 px: 960 is not a breakpoint token. Between 768 and 1023 px the pages use the mobile layout.              |
| Links in text      | Links inside sentences ("Create an account", "Use a different email") are underlined: brand blue next to `text-secondary` is not enough on its own (WCAG 1.4.1). |
| Panel text         | The secondary text of the brand panel uses the `body` style (16/24); 18/28 is not a type token.                                                                  |
| "Forgot password?" | Shown since #24, which builds the reset flow (FR-ACC-008).                                                                                                       |
| Submitting         | The button text changes ("Signing in…", "Creating account…", "Sending…"); the spinner waits for an animation token, as the theme has none.                       |
| Resend wait        | After "Resend email" the button keeps focus and is `aria-disabled` for 60 s, not `disabled`, so keyboard users do not lose their place.                          |
| "Resend the link"  | On sign-in it sends a new link and opens Check your inbox for that address.                                                                                      |
| Expired link       | Still lands on sign-in with the "link expired" alert: the address is unknown once the cookie has expired, so the "This link has expired" page cannot resend.     |
| Sign-up name help  | "Shown to the people in your households." is dropped, as in the screen.                                                                                          |

### Decisions taken building the app shell (#17)

| Topic               | Decision                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Household switcher  | Not shown until #20 builds it, in the Home header or in the sidebar: a button that does nothing would confuse.                                                             |
| Desktop Home        | Until the dashboard (M6), desktop shows the mobile content (greeting, Planner, module tiles) in the sidebar shell; "New note", "Add expense" and the metrics come with M6. |
| Household tile      | Left out until the household has data to show (#19, #28); Home has the Meals, Shopping and Expenses tiles.                                                                 |
| Empty tiles         | Metas derived for the empty state: "Nothing planned for today", "Your list is empty", "Add one when you spend".                                                            |
| Tab bar             | Sticky at the bottom instead of fixed, so it takes its own space and never covers content; scroll padding keeps focused controls clear of it and of the avatar button.     |
| Current destination | Marked with `aria-current="page"`, the tint and a bold label, so it never relies on colour alone.                                                                          |
| Not built yet       | Planner, Meals, Shopping, Expenses and Notifications show their `h1` and an EmptyState "Coming soon" with "Back to Home".                                                  |

### Decisions taken building the launch screen (#18)

| Topic         | Decision                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When it shows | `src/proxy.ts` checks the session before any HTML is sent, and the shell of every page is prerendered, so `loading.tsx` shows only while a signed-in page is still loading, mostly on a slow navigation.       |
| Size          | It fills the content area, not the full viewport: the sidebar and the tab bar stay visible and usable, so a slow navigation never hides them or leaves focus under a cover.                                    |
| Element       | A `div` with `aria-busy="true"`, not a `main`: it renders inside the shell's `main`. The visible text is hidden from screen readers; a `status` gets the same text once it is on the page, so it is announced. |
| Indicator     | `on-brand`, as `splash.md` says; `splash.html` paints it with `surface`. New tokens: `progress-width` (120 px) and `duration-indeterminate` (1200 ms).                                                         |
| Page title    | Next.js empties the title until the new page's metadata arrives, so the launch screen sets "HØEM" while it is shown (WCAG 2.4.2).                                                                              |

### Decisions taken building the household type (#19)

| Topic            | Decision                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create           | Variant A of `new-household`: a standalone form without progress bar, because the setup guide does not exist yet. #32 may make creating step 1 of the guide (variant B), so name and type are not asked twice. |
| Route            | `/settings/household/[id]` until #20 adds the active household.                                                                                                                                                |
| Owner and parent | Separate: an owner can be a relative, a member can be a parent. The owner changing the type is pre-set as a parent; a family needs at least one parent.                                                        |
| Member names     | Since #26 the roles dialog shows each member's name; "Member 2, 3…" in joining order only for a member without a profile.                                                                                      |
| Dialogs          | Centred native `<dialog>`s on every width (the design system's Dialog), not bottom sheets. New tokens: `column` (480 px), `content-width` (720 px), `dialog-width` (440 px).                                   |
| Saved            | A success message under the select instead of a toast; the app has no Toast yet.                                                                                                                               |
| Under 14         | Only the database knows ages, so the refusal appears after "Change type", not before.                                                                                                                          |

### Decisions taken building profile and settings (#21)

| Topic            | Decision                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop layout   | The mobile menu of rows on every width, in a `content-width` column with the subtitle; #22 turns the sections into the desktop cards with forms.   |
| Back link        | Phones only, to Home rather than the previous page, so it works when the page is opened directly. Wider screens keep the sidebar.                  |
| Section titles   | Account, Household, Preferences and Privacy and data are cards with a visible `h2`, so each is a named region (the mobile frame has no "Account"). |
| Language         | Left out until #22: English is the only language in the MVP, so the row would have nothing to change.                                              |
| Notifications    | No value on the right: "On" would be false until push exists (M5).                                                                                 |
| Switch household | Left out until #20 builds the switcher.                                                                                                            |
| Households       | Every household the user belongs to, opening its settings, with "Create a new household": the active household arrives with #20.                   |
| Not built yet    | Account, Appearance, Notifications, Download my data and Delete account open their own page with "Coming soon" and "Back to settings".             |
| Read aloud       | A visually hidden comma separates a row's label from its value ("Appearance, System").                                                             |
| New token        | `avatar-lg` (56 px) for the account avatar.                                                                                                        |

### Decisions taken building the profile forms (#22)

| Topic              | Decision                                                                                                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout             | From 768 px, the cards with forms of the desktop frame (one column on tablets, two from `lg`). Phones keep the menu of rows, and each row opens its own page, which the screen did not define: `/settings/account`, `/settings/appearance` and `/settings/language` hold the same forms under "Back to settings". |
| Email and password | The email is read-only and "Change password" is left out: the issue does not include them, #80 does.                                                                                                                                                                                                              |
| Theme control      | Segments are 44 px tall, not the 36 px of `profile.html`, by the touch target rule.                                                                                                                                                                                                                               |
| Avatar size        | 56 px (`avatar-lg`) on every width, not the 64 px of the desktop frame.                                                                                                                                                                                                                                           |
| Notifications      | A row to "Coming soon" until M5, not the switches of the desktop frame.                                                                                                                                                                                                                                           |
| Households         | The rows of #21, without the role or the "Switch" button of the desktop frame: the switcher is in the header.                                                                                                                                                                                                     |
| Saved              | A message next to the form, as in household settings; the app has no Toast yet.                                                                                                                                                                                                                                   |

### Decisions taken changing the e-mail and password (#80)

| Topic           | Decision                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email           | An editable field with its own secondary "Change email" button, not the card's "Save changes": nothing changes until the link sent to the new address is opened. |
| Waiting         | "We sent a link to …" after sending, and "Waiting for you to confirm …" while Supabase holds the new address, in the status line next to the button.             |
| Change password | A ghost link under the Email field, "Set a password" for an account without one. It opens `/settings/password` on every width, which the screen did not define.  |
| Password page   | The fields of Set a new password (reset-password), with "Current password" first when the account has one; a success message instead of a redirect.              |

### Decisions taken removing the profile photo (#79)

| Topic         | Decision                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button        | "Remove photo", a ghost button next to "Change photo" (wrapping below it on narrow cards), only while there is a photo. The screen did not define it.    |
| At once       | The initials replace the photo in every avatar of the user (card, settings menu, header button, sidebar) as soon as it is pressed, not only in the card. |
| Toast         | The app's first toast: "Photo removed" with "Undo", right above the tab bar on phones and at the bottom of the content from 768 px.                      |
| Time to react | The 5-second countdown pauses while the pointer or the focus is on the toast (WCAG 2.2.1).                                                               |
| Focus         | After removing, focus moves to "Change photo", since the pressed button disappears.                                                                      |
| Failure       | The photo comes back and the toast says "We could not remove your photo. Try again." as an alert.                                                        |

### Decisions taken building the household switcher (#20)

| Topic           | Decision                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pattern         | The WAI-ARIA menu button at every width: a bottom sheet on phones and a menu under the sidebar button on wider screens, with the same keyboard behaviour. Not a modal dialog on phones, so one widget does both.          |
| Active row      | `menuitemradio` with `aria-checked="true"` instead of `aria-current`, the state a menu of choices announces; the check icon, border and tint show it too.                                                                 |
| Keyboard        | Enter, Space and ↓ open on the active household, ↑ on the last item; ↑ ↓ wrap, Home and End jump; Escape and Tab close and return focus to the button. The sheet's Close button and the scrim are for touch and pointers. |
| Where on phones | Only the Home header, as in `home.md`; other pages switch from Home.                                                                                                                                                      |
| Switching       | The chosen row reads "Switching…" (the theme has no spinner animation); on success the menu closes, focus returns to the button and a status message says which household is now active.                                  |
| "Just me"       | A single household shows only its type, never "1 member".                                                                                                                                                                 |
| Sidebar rows    | Smaller icon (32 px) and padding, so "Shared flat · 2 members" and "Create a new household" fit the 264 px sidebar on one line.                                                                                           |
| Kept            | The household in settings stays at `/settings/household/[id]`, and creating a household still opens its settings: #20 adds only the switcher.                                                                             |

### Decisions taken building members and roles (#26)

| Topic         | Decision                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row           | As drawn in the HTML, not the `.md`: the role is secondary text under the name ("Owner · Parent" in a family), not a Badge, and the chevron button opens a Dialog, not a Menu.            |
| Section       | A Card with an `h2` "Members", like Details (#19), above Details as in the screen. "Invite" comes with #27.                                                                               |
| Row height    | 64 px (`min-h-16`, the 8-point grid), not the 60 px of the HTML.                                                                                                                          |
| Desktop       | The same list in the 720 px column, not a table: one markup for every width, and the dialog holds the actions a table would put in columns.                                               |
| Options       | Only for members the user may change. The dialog lists only allowed actions; a blocked one says what to do first ("Make someone else owner first.", "Make someone else a parent first."). |
| Own row       | The only owner sees the chevron too: their dialog explains why they cannot step down yet. Removing yourself is leaving, a separate issue.                                                 |
| Confirmations | Role changes close the dialog and show a success message at the top of the section; focus returns to the row's button.                                                                    |
| Removal       | Hidden at once with "{name} removed from the household" and Undo (ADR-009), in the shell's toast slot; focus moves to the "Members" heading, since the row's button disappears.           |

## Open questions

Each screen is reviewed against the SRS, the architecture and the existing code by the issue that
builds it. A difference found then is asked, not silently resolved, and recorded in the table above.
