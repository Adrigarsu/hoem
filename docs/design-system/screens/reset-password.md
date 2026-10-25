# Set a new password

**Reference:** `reset-password.html` · **Requirements:** FR-ACC-008, NFR-SEC-003 · **Issue:** #24 · **Route:** `/auth/reset-password?token_hash=…` (group `(auth)`, opened from the e-mail `supabase/templates/recovery.html`)

> **Derived screen (#24).** Not on the canvas; built from the sign-up pieces. Review it before building.

## Purpose

Lets the person who opened the reset link choose a new password. The link is checked when the form is sent, not when the page opens, so mail scanners that open links cannot use it up (decided in #24).

## Layout — mobile (360 px)

Column, padding `space-6` top and sides, `space-8` bottom; gap `space-6`.

1. Back link "Back to sign in".
2. Title block (gap `space-2`): `h1` "Choose a new password" (heading 32/40); "You'll be signed in with it, and signed out on your other devices." (16/24, `text-secondary`).
3. Form `aria-label="Choose a new password"`, gap `space-4`:
   - Alert (error states only).
   - Hidden input with the token from the link.
   - Field "New password" (`autocomplete=new-password`, show/hide toggle) with helper "At least 10 characters."
   - Field "Repeat the password" (`autocomplete=new-password`, show/hide toggle).
   - Primary button, full width: "Save and sign in".

**Expired state** replaces the title block and the form:

1. Back link "Back to sign in".
2. Message block (gap `space-4`): `h1` "This link no longer works"; "Reset links work once and for 1 hour. Ask for a new one and use the latest email." (16/24, `text-secondary`).
3. Primary button-link, full width: "Ask for a new link" (to `/forgot-password`).

## Layout — desktop (1440 px)

Desktop auth shell (brand panel left), same column centred on the right, max `column-narrow`.

## Components

AuthShell, BackToSignIn, PasswordField, Button (primary), FormMessage, Link.

## Texts

| Key                               | Text                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `Auth.resetPassword.title`        | Choose a new password                                                             |
| `Auth.resetPassword.lede`         | You'll be signed in with it, and signed out on your other devices.                |
| `Auth.resetPassword.password`     | New password                                                                      |
| `Auth.resetPassword.passwordHelp` | At least {min} characters.                                                        |
| `Auth.resetPassword.confirm`      | Repeat the password                                                               |
| `Auth.resetPassword.submit`       | Save and sign in                                                                  |
| `Auth.resetPassword.submitting`   | Saving…                                                                           |
| `Auth.resetPassword.expiredTitle` | This link no longer works                                                         |
| `Auth.resetPassword.expired`      | Reset links work once and for 1 hour. Ask for a new one and use the latest email. |
| `Auth.resetPassword.askAgain`     | Ask for a new link                                                                |

## States

- **Default**: fields empty.
- **Submitting**: button "Saving…", `aria-busy`, stays focusable.
- **Validation** (on submit, same schema as sign-up): fewer than 10 characters, longer than 72 bytes, or the two fields differ → message under the field, `aria-invalid`, focus to the first error.
- **Same password as before**: accepted like any other (decided in #24); Supabase reports `same_password` and the service treats it as success.
- **Expired or used link** (found on submit), or a link without a token: the expired state; focus moves to its `h1`.
- **Success**: signed in, other sessions signed out, redirected to Home.

## Mobile vs desktop

Only the shell changes.

## Accessibility

The password rule is visible before typing. Both fields keep pasting and password managers working (`autocomplete=new-password`).
