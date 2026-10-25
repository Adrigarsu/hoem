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
| "Forgot password?" | Hidden until FR-ACC-008 (#24) builds the reset flow, like Google and the demo.                                                                                   |
| Submitting         | The button text changes ("Signing in…", "Creating account…", "Sending…"); the spinner waits for an animation token, as the theme has none.                       |
| Resend wait        | After "Resend email" the button keeps focus and is `aria-disabled` for 60 s, not `disabled`, so keyboard users do not lose their place.                          |
| "Resend the link"  | On sign-in it sends a new link and opens Check your inbox for that address.                                                                                      |
| Expired link       | Still lands on sign-in with the "link expired" alert: the address is unknown once the cookie has expired, so the "This link has expired" page cannot resend.     |
| Sign-up name help  | "Shown to the people in your households." is dropped, as in the screen.                                                                                          |

## Open questions

Each screen is reviewed against the SRS, the architecture and the existing code by the issue that
builds it. A difference found then is asked, not silently resolved, and recorded in the table above.
