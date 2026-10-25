# Home

**Reference:** `home.html` · **Requirements:** FR-NAV-001, FR-NAV-002, FR-DASH-001 to 005, FR-DEMO-002 · **Issues:** M1-04 (shell and hub), M6 (dashboard data, demo) · **Route:** `/`

## Purpose

The hub of the app: what matters today, notes and reminders, and one tap to every module.

## Layout — mobile (360 px)

- **Avatar button** fixed top right (44 px target, 40 px avatar with a 2 px `bg` gap ring and 1 px `border-control` ring): "Profile and settings".
- **Header** (padding `space-4`): household button (Card-style button: house icon in a `brand-tint` circle, "Calle Mayor flat", chevron; hidden text ", switch household") · spacer · IconButton bell "Notifications, 2 new" with an 8 px `brand` dot · space reserved for the avatar.
- **Main** (padding `space-2` `space-4`, bottom 104 px for the tab bar; gap `space-4`):
  1. Greeting: `h1` "Good morning, Lucía" (24/32, 700) and the date "Wednesday, 7 October" (`text-secondary`).
  2. **Planner card** (Card): title row with calendar icon (`brand`) and `h2` "Planner", link "Open" (hidden text " planner"). Quick-add field styled as an input: "+ Write a note…" (opens New note). List of up to 3 notes, each a 60 px row: title (16/24, 600), meta line with icon (repeat icon + "Monthly · 1 Nov, 09:00"; lock icon + "Private · no reminder"), pin icon when pinned, chevron.
  3. **Your home** (eyebrow `h2`) — 2 × 2 grid of Tiles (gap `space-3`). Each tile: module icon tile (36 px, `{module}-tint` / `{module}-ink`), chevron, label (14/20, 600), headline (20/28, 700), meta (12/16, `text-secondary`):
     - Meals — "Lentil stew" — "Today's lunch · 4 planned"
     - Shopping — "5 items" — "Marcos added milk"
     - Expenses — "€412.60" — "69% of €600 budget"
     - Household — "2 members" — "You owe Marcos €23.40"
- **Tab bar** (fixed bottom, `surface`, top `border`): Shopping, Expenses, **Home** (current: `brand-tint` pill, `brand` label, `aria-current="page"`), Planner, Meals.

## Layout — desktop (1440 px)

Sidebar shell (Home current). Main column max 1120 px, padding `space-8` 40 px.

1. Header row: greeting `h1` (32/40) + date; actions right: secondary "New note", primary "Add expense", IconButton bell.
2. Two cards side by side: **Planner** (quick note input + "Add" button, list of 4 notes with Badges: recurrence in `brand-tint`, "Shared" / "Private" neutral badges with icons) and **Today's meals** ("View week" link; rows with the slot as eyebrow and the dish name).
3. Three metric cards in a row: Shopping list ("5 items", "Marcos added milk just now"), Shared this month ("€412.60", "69% of the €600 budget" with a progress bar), Balance ("€23.40", "You owe Marcos").

## Components

AvatarFab, HouseholdSwitcher button, IconButton, Card, ListRow, Badge, Tile, Metric, ProgressBar, TabBar / Sidebar, Button.

## Texts

`home.greeting.morning|afternoon|evening` "Good morning, {name}" · `home.planner` "Planner" · `home.open` "Open" · `home.writeNote` "Write a note…" · `home.yourHome` "Your home" · tile labels and metas (with plurals: "{count} items", "{count} planned") · `home.todayMeals` "Today's meals" · `home.viewWeek` "View week" · `home.sharedThisMonth` "Shared this month" · `home.balance` "Balance" · `home.youOwe` "You owe {name}" / `home.owesYou` "{name} owes you" · `demo.banner` "You're exploring a demo household. Changes reset after 24 hours." · `demo.signUp` "Sign up".

## States

- **Loading** (drawn): same layout with skeleton blocks (`surface-subtle`, `radius-sm`) in place of text; `main` has `aria-busy="true"` and a hidden "Loading your home" status. No spinner.
- **Demo mode** (drawn): full-width banner above the header (`brand-tint` / `brand-ink`, info icon, link "Sign up"). Fix when building: the avatar button must sit below the banner, not over it.
- **Empty module**: tiles still show; headline becomes an action ("Plan a meal", "Add an item", "No expenses yet"), meta explains the next step.
- **No notes**: Planner card shows only the quick-add field and "No notes yet. Write one for the household or just for you."
- **Error loading a section**: the section shows "Couldn't load this. Retry" inline; the rest of the page still renders.
- **Module not built yet** (until its milestone): its tile and tab open an EmptyState "Coming soon".

## Mobile vs desktop

Desktop replaces tab bar + avatar with the sidebar, moves "New note" and "Add expense" into the header, shows Today's meals as its own card and the module tiles as three metric cards (Household moves to the sidebar switcher).

## Accessibility

Each tile is one link whose accessible name is its visible text in order. The notification dot is not the only signal: the accessible name says "2 new".
