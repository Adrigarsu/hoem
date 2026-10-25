# Sign in

**Reference:** `sign-in.html` · **Requirements:** FR-ACC-001, FR-ACC-002, FR-ACC-008, FR-DEMO-001, NFR-SEC-003 · **Issues:** M0-9, M1-11, M1-12 · **Route:** `/sign-in` (group `(auth)`)

## Purpose

Returning users sign in with Google or e-mail and password. Visitors can create an account or open the demo without an account.

## Layout — mobile (360 px)

Column, padding `space-16` top (64 px), `space-6` sides, `space-8` bottom; gap `space-8`. The page scrolls when the content is taller than the screen.

1. **Brand block** (gap `space-4`)
   - Logo "HØEM" (Montserrat 800, 32 px, `text`; "Ø" in `brand`).
   - `h1` "Your home, organised together." — heading style (32/40, 700).
   - Lede "Meals, shopping and money, shared with the people you live with." — 16/24, `text-secondary`.
2. **Form** `aria-label="Sign in"`, gap `space-4`
   - Secondary button with Google logo: "Continue with Google".
   - Divider "or" (two `border` lines, text 14/20 `text-secondary`).
   - Field "Email": input `type=email`, `autocomplete=email`, placeholder "you@example.com".
   - Field "Password": label row with the link "Forgot password?" aligned right; input `type=password`, `autocomplete=current-password`.
   - Primary button, full width: "Sign in".
   - Centred text: "New to HØEM? **Create an account**" (link to `/sign-up`).
3. **Demo card** (Card, padding `space-5`, gap `space-3`, pushed to the bottom with `margin-top: auto`)
   - `h2` "Just looking around?" — 16/24, 600.
   - "Explore a household full of sample meals, lists and expenses. No account needed." — 14/20, `text-secondary`.
   - Secondary button, full width: "Try the demo" + arrow icon.

## Layout — desktop (1440 px)

Two columns that wrap below 960 px (`flex: 1 1 480px` each):

- **Brand panel** (left): background `brand`, text `on-brand`, padding `space-12` / 56 px. Top: logo 32 px. Middle (max 480 px): "Your home, organised together." (display 40/48) and "Plan the week's meals, share one shopping list and keep shared and private expenses apart, with the people you live with." (18/28, `brand-tint`). Bottom: three module chips (Meals, Shopping, Expenses) — pill, `surface` background, each in its module `-ink` colour with its icon.
- **Form column** (right): centred, max width 400 px, gap `space-6`. `h1` "Sign in" + "New to HØEM? Create an account" under it; then the same form as mobile (without the bottom sign-up line); then the demo card in a single row (text left, "Try the demo" secondary button right).

## Components

Logo, Button (primary, secondary), Field + Input, Divider, Card, Alert (error states), Link.

## Texts

| Key                       | Text                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| `signIn.tagline`          | Your home, organised together.                                                   |
| `signIn.lede`             | Meals, shopping and money, shared with the people you live with.                 |
| `signIn.google`           | Continue with Google                                                             |
| `signIn.or`               | or                                                                               |
| `signIn.email`            | Email                                                                            |
| `signIn.password`         | Password                                                                         |
| `signIn.forgot`           | Forgot password?                                                                 |
| `signIn.submit`           | Sign in                                                                          |
| `signIn.noAccount`        | New to HØEM? {link}                                                              |
| `signIn.createAccount`    | Create an account                                                                |
| `signIn.demoTitle`        | Just looking around?                                                             |
| `signIn.demoText`         | Explore a household full of sample meals, lists and expenses. No account needed. |
| `signIn.demoCta`          | Try the demo                                                                     |
| `signIn.errorCredentials` | Email or password is incorrect.                                                  |
| `signIn.errorUnverified`  | Confirm your email first. We sent a link to {email}. {link}                      |
| `signIn.resend`           | Resend the link                                                                  |

## States

- **Default**: as above. Fields empty.
- **Submitting**: "Sign in" shows a spinner, text "Signing in…", button disabled; fields read-only.
- **Error: wrong e-mail or password** (drawn): Alert `danger` (`danger-tint` / `danger-ink`, alert icon) as the first child of the form, `role="alert"`. It never says which field is wrong (security). The e-mail stays filled; the password is cleared.
- **Error: e-mail not confirmed** (drawn): Alert `warning` with a "Resend the link" link that goes to Check your inbox and sends a new e-mail.
- **Field validation** (on submit, not while typing): empty or malformed e-mail → message under the field in `danger`, `aria-invalid="true"`, linked with `aria-describedby`; focus moves to the first invalid field.
- **Google cancelled**: back on this page with an Alert `neutral`: "Google sign-in was cancelled. Nothing was created."
- **Offline**: Alert `warning` "You're offline. Connect to sign in."

## Mobile vs desktop

Desktop adds the brand panel and moves "Create an account" under the title; the demo card becomes one row. Same form and states.

## Accessibility

Labels are visible `<label>` elements. "Forgot password?" sits outside the label. The Google button keeps the official multicolour logo (not themed). Autocomplete attributes let password managers work.
