# Create account

> **Decision (#57):** two password fields, "Password" and "Repeat the password", each with a show/hide toggle. See "Decisions on the hand-off" in README.md.

**Reference:** `sign-up.html` · **Requirements:** FR-ACC-001, FR-ACC-002, NFR-LEG-001, NFR-SEC-003 · **Issues:** M0-9, M1-16 · **Route:** `/sign-up` (group `(auth)`)

## Purpose

Creates an account with Google or e-mail. After it, the user confirms the e-mail (Check your inbox) and then runs the household setup.

> **Change from the canvas:** an age confirmation was added for NFR-LEG-001 (decision Q2: no date of birth is stored). The desktop layout is derived from the desktop sign-in shell.

## Layout — mobile (360 px)

Column, padding `space-6` (24 px) top and sides, `space-8` bottom; gap 28 px.

1. Back link "Back to sign in" (ghost, chevron-left icon, 44 px tall).
2. Title block (gap `space-2`): `h1` "Create your account" (32/40); "Next, we'll set up your household together." (16/24, `text-secondary`).
3. Form `aria-label="Create account"`, gap `space-4`:
   - Secondary button with Google logo: "Sign up with Google".
   - Divider "or".
   - Field "Your name" (`autocomplete=given-name`).
   - Field "Email" (`type=email`, placeholder "you@example.com").
   - Field "Password" (`autocomplete=new-password`) with helper "At least 10 characters." (`aria-describedby`).
   - Checkbox (required): "I'm 14 or older." + second line "Under 14? Ask a parent to invite you to your family's household."
   - Checkbox (required): "I agree to the **terms** and the **privacy policy**." (two links).
   - Primary button, full width: "Create account".
4. Footer text, centred at the bottom: "We'll send you an email to confirm it's really you." (14/20, `text-secondary`).

## Layout — desktop (1440 px)

Desktop auth shell (see `sign-in.md`): brand panel left, the same column (max 400 px) centred on the right. The footer text sits right under the button.

## Components

Button (primary, secondary, ghost link), Field + Input, Checkbox, Divider, Alert, Link.

## Texts

| Key                   | Text                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `signUp.back`         | Back to sign in                                                  |
| `signUp.title`        | Create your account                                              |
| `signUp.lede`         | Next, we'll set up your household together.                      |
| `signUp.google`       | Sign up with Google                                              |
| `signUp.name`         | Your name                                                        |
| `signUp.email`        | Email                                                            |
| `signUp.password`     | Password                                                         |
| `signUp.passwordHelp` | At least 10 characters.                                          |
| `signUp.age`          | I'm 14 or older.                                                 |
| `signUp.ageHelp`      | Under 14? Ask a parent to invite you to your family's household. |
| `signUp.terms`        | I agree to the {terms} and the {privacy}.                        |
| `signUp.submit`       | Create account                                                   |
| `signUp.confirmNote`  | We'll send you an email to confirm it's really you.              |

## States

- **Submitting**: button disabled with spinner, "Creating account…".
- **Success**: navigate to Check your inbox with the e-mail.
- **Validation** (on submit): name required; e-mail format; password ≥ 10 characters; both checkboxes required. Message under each field (`danger`), `aria-invalid`, focus to the first error. Age not confirmed → "You need to be 14 or older to create an account."
- **E-mail already registered**: do not reveal it. Show the same success screen; the existing user receives an e-mail that explains they already have an account (prevents account enumeration).
- **Server error**: Alert `danger` at the top of the form: "We couldn't create your account. Try again in a moment."

## Mobile vs desktop

Only the shell changes (brand panel on desktop).

## Accessibility

The password rule is visible before typing, not only as an error. Checkboxes have their whole label clickable and are 22 px with a 44 px target row.
