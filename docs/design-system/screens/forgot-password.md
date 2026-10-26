# Forgot password

**Reference:** `forgot-password.html` · **Requirements:** FR-ACC-008 · **Issue:** #24 · **Route:** `/forgot-password` (group `(auth)`)

> **Derived screen (#24).** Not on the canvas; built from the Check your inbox and sign-up pieces. Review it before building.

## Purpose

Asks for the address of the account and sends a link to set a new password. The answer is the same whether or not an account exists, so the page never reveals who has signed up.

## Layout — mobile (360 px)

Column, padding `space-6` top and sides, `space-8` bottom; gap `space-6`. Same frame as Check your inbox.

1. Back link "Back to sign in".
2. Title block (gap `space-2`): `h1` "Reset your password" (heading 32/40); "Enter the email you signed up with and we'll send you a link to choose a new password." (16/24, `text-secondary`).
3. Form `aria-label="Reset your password"`, gap `space-4`:
   - Alert (error states only, see States).
   - Field "Email" (`type=email`, `autocomplete=email`, placeholder "you@example.com").
   - Primary button, full width: "Send link".

**Sent state** replaces the title block and the form (same frame, gap `space-6`):

1. Back link "Back to sign in".
2. Message block (gap `space-4`): IconTile with the mail icon; `h1` "Check your inbox"; "If an account exists for **lucia@example.com**, we sent it a link to choose a new password." (16/24, `text-secondary`; the address in `text`, 600).
3. Note (info icon): "The link works for 1 hour. Can't find the email? Look in your spam or promotions folder."
4. Centred: "Wrong address? **Try a different email**" (button styled as a link; shows the form again with the address filled in).

## Layout — desktop (1440 px)

Desktop auth shell (brand panel left), same column centred on the right, max `column-narrow`.

## Components

AuthShell, BackToSignIn, TextField, Button (primary), FormMessage, IconTile, Note, Link.

## Texts

| Key                                | Text                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `Auth.forgotPassword.title`        | Reset your password                                                                      |
| `Auth.forgotPassword.lede`         | Enter the email you signed up with and we'll send you a link to choose a new password.   |
| `Auth.forgotPassword.email`        | Email                                                                                    |
| `Auth.forgotPassword.submit`       | Send link                                                                                |
| `Auth.forgotPassword.submitting`   | Sending…                                                                                 |
| `Auth.forgotPassword.sentTitle`    | Check your inbox                                                                         |
| `Auth.forgotPassword.sent`         | If an account exists for {email}, we sent it a link to choose a new password.            |
| `Auth.forgotPassword.note`         | The link works for 1 hour. Can't find the email? Look in your spam or promotions folder. |
| `Auth.forgotPassword.wrongAddress` | Wrong address? {link}                                                                    |
| `Auth.forgotPassword.tryDifferent` | Try a different email                                                                    |
| `Auth.forgotPassword.linkExpired`  | That link has expired or was already used. Ask for a new one below.                      |

## States

- **Default**: as above, field empty. Coming from sign-in, the field is not prefilled (the address typed there is not carried over).
- **Submitting**: button "Sending…", `aria-busy`, stays focusable.
- **Validation** (on submit): empty or malformed e-mail → message under the field, `aria-invalid`, focus to the field.
- **Sent**: always the same text, whether or not the account exists. Focus moves to the `h1` so screen readers hear the new state.
- **Rate limited**: Alert `danger` "Too many attempts. Wait a few minutes and try again." (does not reveal whether the account exists).
- **Arrived from an expired or used link** (`?error=linkExpired`): Alert `warning` with `Auth.forgotPassword.linkExpired` above the field.

## Mobile vs desktop

Only the shell changes.

## Accessibility

One `h1` in each state. The address in the sent state is plain text. "Try a different email" is a `button` (it changes the page state, it does not navigate).
