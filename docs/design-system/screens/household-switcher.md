# Switch household

**Reference:** `household-switcher.html` · **Requirements:** FR-ACC-004, FR-ACC-009 · **Issue:** M1-07 · **Route:** none (sheet over the current screen)

## Layout — mobile (360 px)

Bottom sheet over a `scrim`; `surface`, radius `radius-xl` on the top corners, padding `space-3` `space-6` `space-8`; drag handle 40 × 4 px (`border-control`).

1. Title row: `h2` "Your households" and IconButton "Close".
2. List of households (radio-like rows, 64 px): icon tile (house in `brand-tint`), name (16/24, 600) and "type · members" (14/20, `text-secondary`); the active one has a check icon and `aria-current="true"`.
   - Calle Mayor flat — Shared flat · 2 members (active)
   - García family — Family · 4 members
   - My place — Just me
3. Secondary button with plus icon: "Create a new household".

## Layout — desktop

A menu anchored under the household button of the sidebar (WAI-ARIA menu button pattern), width = sidebar, same rows; "Create a new household" as the last item.

## Components

Sheet (mobile) / Menu (desktop), ListRow, IconTile, Button.

## Texts

`switcher.title` "Your households" · `switcher.close` "Close" · type labels "Shared flat", "Family", "Just me", "Something else" · `switcher.members` "{count, plural, one {# member} other {# members}}" · `switcher.create` "Create a new household".

## States

- **Switching**: the chosen row shows a spinner; on success the sheet closes and every screen reloads with that household (kept after reload, FR-ACC-004).
- **Only one household**: the list has one row; the create button stays.

## Accessibility

Focus moves into the sheet and is trapped; Escape and the close button return focus to the household button. Arrow keys move between rows on desktop.
