# Household settings

**Reference:** `household-settings.html` · **Requirements:** FR-ACC-005, FR-ACC-006, FR-ACC-009, FR-HH-001, FR-HH-006 to 010, FR-ONB-006 · **Issues:** M1-06, M1-13, M1-14, M1-17, M1-18 · **Route:** `/settings/household`

## Layout — mobile (360 px), owner of a shared flat (drawn)

1. Back link "Profile"; `h1` "Calle Mayor flat"; subtitle "Household settings · you're the owner".
2. Section "Members" with a small secondary button "Invite": member rows — avatar, name ("Lucía (you)", "Marcos"), role Badge (Owner / Member), IconButton "Options for {name}" (menu: make owner, remove; family: change family role).
3. Section "Details": field "Name"; select "Type" (Shared flat, Just me, Family, Something else) with helper "Changing the type never reveals existing private data."
4. Section "How the household works": rows with value — "Split shared expenses" → "Equally between members"; "Meals to plan" → "4 of 5"; "Monthly shared budget" → "€600".
5. Ghost button "Run the setup guide again".
6. `danger` text button "Leave household".
7. Tab bar.

## Layout — desktop

Not designed. Use the content column of the desktop shell (max 720 px) with the same sections as Cards; the member list becomes a table (name, role, actions).

## Components

ListRow, Avatar, Badge, IconButton + Menu, Field + Input, Select, Button (secondary, ghost, danger).

## Texts

`household.settings` "Household settings", `household.youAreOwner` "you're the owner", `household.members`, `household.invite`, `household.you` "{name} (you)", roles (Owner, Member, Parent, Child, Relative), `household.options` "Options for {name}", `household.details`, `household.name`, `household.type`, `household.typeHelp`, `household.rules` "How the household works", `household.split`, `household.splitEqual` "Equally between members", `household.mealsToPlan`, `household.slotsOf` "{n} of 5", `household.budget`, `household.rerunSetup`, `household.leave`.

## States

- **Member (not owner)**: everything is read-only except "Leave household"; the type select is disabled with the text "Only owners can change this".
- **Family, parent**: family roles shown; parents can invite and change roles; the split row reads "Parents decide" (FR-HH-009).
- **Changing the type**: warning dialog (FR-HH-007); to Family, assign a family role to every member first.
- **"Other" household** (FR-HH-010): an extra row "Privacy rules" opens the rules screen.
- **Last owner leaving**: blocked with "Make someone else owner first."
- **Pending invitations**: listed under the members with "Pending" Badge and cancel.

## Accessibility

Role changes are confirmed and announced. Disabled controls explain why in text.
