# Check your inbox

> **Decision (#57):** the address is passed in a short-lived HttpOnly cookie, never in the URL; the link expires after 1 hour. See "Decisions on the hand-off" in README.md.

**Reference:** `check-your-inbox.html` · **Requirements:** FR-ACC-001 · **Issue:** M0-9 · **Route:** `/check-your-inbox` (group `(auth)`)

> **New screen.** It was not on the canvas; it is built from the sign-up and sign-in pieces. Review it before building.

## Purpose

Tells the user that a confirmation e-mail was sent, where it went and what to do if it does not arrive.

## Layout — mobile (360 px)

Column, padding `space-6` top and sides, `space-8` bottom; gap `space-6`.

1. Back link "Back to sign in".
2. Message block (gap `space-4`):
   - Icon tile 64 px, `radius-full`, `brand-tint` / `brand-ink`, mail icon 28 px (decorative).
   - `h1` "Check your inbox" (32/40).
   - "We sent a link to **lucia@example.com**. Open it to confirm your email and set up your household." (16/24, `text-secondary`; the address in `text`, 600).
3. Info note (`surface-subtle`, `radius-md`, info icon): "The link works for 1 hour. Can't find the email? Look in your spam or promotions folder."
4. Status message (only after resending, see States).
5. Secondary button, full width: "Resend email".
6. Centred: "Wrong address? **Use a different email**" (link back to sign-up with the fields kept except the password).

## Layout — desktop (1440 px)

Desktop auth shell (brand panel left), same column centred on the right, max 400 px.

## Components

Button (secondary, ghost link), IconTile, Note, Alert (`success`), Link.

## Texts

| Key                       | Text                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `checkInbox.title`        | Check your inbox                                                                         |
| `checkInbox.sent`         | We sent a link to {email}. Open it to confirm your email and set up your household.      |
| `checkInbox.note`         | The link works for 1 hour. Can't find the email? Look in your spam or promotions folder. |
| `checkInbox.resend`       | Resend email                                                                             |
| `checkInbox.resent`       | We sent a new link. The previous one no longer works.                                    |
| `checkInbox.wait`         | You can ask for another link in {seconds} s.                                             |
| `checkInbox.wrongAddress` | Wrong address? {link}                                                                    |
| `checkInbox.useDifferent` | Use a different email                                                                    |

## States

- **Default** (drawn).
- **Resent** (drawn): success message (`success-tint` / `success-ink`, check icon, `role="status"`) above the button; the button is disabled for 60 s with the countdown text linked by `aria-describedby`. Disabled style: `surface-subtle` background, `border`, `text-muted`.
- **Sending**: button shows a spinner, "Sending…".
- **Error / rate limited by the server**: Alert `danger`: "We couldn't send the email. Try again in a few minutes."
- **Link opened**: not on this screen — the confirmation link signs the user in and opens the setup guide (`/setup`).
- **Expired link** (landing page of the link): reuse this layout with `h1` "This link has expired" and the "Resend email" button.

## Mobile vs desktop

Only the shell changes.

## Accessibility

The e-mail address is plain text (not a link). The countdown is not announced every second; only the "resent" status is announced.
