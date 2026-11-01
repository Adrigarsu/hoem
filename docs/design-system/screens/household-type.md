# Household settings: name and type

**Reference:** `household-type.html` · **Requirements:** FR-ACC-009, FR-HH-007, NFR-LEG-001 · **Issue:** #19 · **Route:** `/settings/household/[id]` (until #20 adds the active household; then `/settings/household`)

The "Details" section of `household-settings` and the flow that changes the type.

## Layout

Header: back link "Profile", `h1` with the household name, "Household settings · you're the owner"
(or "you're a member"). Then a Card "Details", max `content-width` (720 px):

1. Field "Name" and secondary "Save name" (owners only); "Name saved." is announced after saving.
2. Select "Type" (Just me, Family, Shared flat, Something else) with "Changing the type never reveals existing private data."

## The type change

Picking another type opens a dialog at once; nothing is saved until the owner confirms. Dialogs
are native modal `<dialog>`s, centred, at most `dialog-width` (440 px); Escape or the cancel action
closes them, puts the select back and returns focus to it.

1. **Warning** — "Change to {type}?" + "The new rules only apply to things created from now on. Everything already saved keeps who can see it." + what changes for that type. Actions: "Keep {current type}" and "Change type" (or "Continue" for Family).
2. **Family roles** (Family only) — "Who is who in the family?": one select per member, labelled "You · Owner", "Member 2 · Member"… in joining order (names come with #26). You are pre-set as a parent and can change it; nobody else has a role by default. Actions: "Back" and "Change to Family".
3. **Saved** — the select shows the new type and "{name} is now a {type} household." is announced.

## States

- **Member (not owner)**: name and type disabled, with "Only owners can change this."
- **Missing role**: "Choose a role for Member 2" under the select, focus on it; nothing saved.
- **No parent**: "A family needs at least one parent" above the selects.
- **"Just me" with other members**: alert dialog "\"Just me\" is for one person" — "{name} has 1 other member. Remove them first, then change the type." Action "Keep {type}" ("Go to members" comes with #26).
- **Someone under 14** (refused by the database): alert dialog "This household must stay a family" — "Someone in it is under 14, and children under 14 can only belong to a family household." Action "Keep Family". No names or ages.

## Components

Card, TextField, SelectField, Dialog, Button, FormMessage.

## Texts

`Households.settings.*`, `Households.typeChange.*`, `Households.validation.*`.
