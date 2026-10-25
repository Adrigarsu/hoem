# Setup guide: step 4, people

**Reference:** `setup-people.html` · **Requirements:** FR-ONB-005, FR-ONB-007, FR-ACC-005, FR-HH-006 · **Issue:** M1-21 · **Route:** `/setup/people`

## Layout — mobile (360 px)

Same frame (progress "Step 4 of 4", fixed footer Back / **Finish**).

1. `h1` "Who do you live with?" + "They'll get an email with a link that works for 7 days. You can also do this later."
2. Invite form `aria-label="Invite someone"`: field "Email address" and secondary button "Invite" in one row.
3. "Invited" list (Card): each row has an avatar with the initial, the e-mail, a `warning` badge "Pending" and an IconButton "Cancel invitation for {email}".
4. Ghost button: "Copy invite link instead".

## Layout — desktop

Centred column, max 480 px.

## Components

StepProgress, Field + Input, Button (secondary, ghost), List rows with Avatar, Badge, IconButton.

## Texts

`setup.people.title`, `setup.people.lede`, `setup.people.email` "Email address", `setup.people.invite` "Invite", `setup.people.invited` "Invited", `setup.people.pending` "Pending", `setup.people.cancel` "Cancel invitation for {email}", `setup.people.copyLink` "Copy invite link instead", `setup.finish` "Finish".

## States

- **Family household**: each invitation also needs a family role (parent, child, relative); a child under 14 asks the parent to confirm consent (NFR-LEG-001).
- **Already a member**: "{email} is already in this household." No e-mail is sent.
- **Sent**: the row appears with "Pending"; a polite live region announces "Invitation sent to {email}".
- **Link copied**: Toast "Link copied".
- **Empty**: "Finish" still works.

## Accessibility

The cancel button names the e-mail. Pending is shown with text, not only colour.
