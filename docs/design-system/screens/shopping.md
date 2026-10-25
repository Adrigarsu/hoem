# Shopping

**Reference:** `shopping.html` · **Requirements:** FR-SHOP-001 to 004, FR-HH-005, FR-INT-001, NFR-PERF-003, NFR-UX-002 · **Issue:** M2 · **Route:** `/shopping`

## Layout — mobile (360 px)

1. Avatar button top right.
2. Header: `h1` "Shopping", "5 of 6 items left", presence avatars (`aria-label="Also on this list now"`: Marcos, Lucía (you)), each 28 px with a `surface` ring.
3. List selector (segmented, `aria-label="Lists"`): "Shared list" / "My private list" (lock icon).
4. Add form (`aria-label="Add an item"`): input "New item" + primary IconButton "Add item".
5. Items grouped by category (`h2` eyebrows): **Produce** (Tomatoes 1 kg, Rice 500 g), **Dairy** (Milk 2 l — "Added by Marcos · just now", highlighted with `shopping-tint` for a few seconds; Greek yogurt 4), **Home and cleaning** (Toilet paper 12 rolls, Dish soap 1). Each item: 24 px checkbox, name (16/24), optional meta, quantity right-aligned (`text-secondary`). Checked items: line-through, `text-muted`, moved to the bottom of their group.
6. Primary button above the tab bar: "Finish shopping".
7. Tab bar with Shopping current.

## Layout — desktop (1440 px)

Sidebar (Shopping current). Header: `h1` "Shopping", "5 of 6 items left · Marcos is on this list", list selector, secondary "Finish shopping". Two columns: list Card (add form with "Add" button, then the grouped items) and a right aside **"From this week's meals"**: "Add a recipe's ingredients; you'll choose which ones you need." with recipe rows (Paella — Saturday lunch, Grilled salmon — Thursday dinner, Chicken wraps — Friday lunch) and an IconButton "Add ingredients of {dish} to the shopping list" each.

## Components

SegmentedControl, AvatarGroup, Input + IconButton, ShoppingItem (checkbox row), Eyebrow, Button, Toast, Alert (offline), EmptyState.

## Texts

`shopping.title`, `shopping.left` "{left} of {total} items left", `shopping.presence` "Also on this list now", `shopping.onList` "{name} is on this list", `shopping.shared` "Shared list", `shopping.private` "My private list", `shopping.newItem` "New item", `shopping.add` "Add item", category names, `shopping.addedBy` "Added by {name} · {time}", `shopping.finish` "Finish shopping", `shopping.empty.title` "Your list is empty", `shopping.empty.text` "Add things as you think of them, or bring in the ingredients from this week's meals.", `shopping.empty.cta` "Add from this week's meals", `shopping.nothing` "Nothing to buy yet", `shopping.offline` "You're offline. Reconnect to see the latest list.", `shopping.lastUpdated` "Last updated {time}", `shopping.notSaved` "Not saved yet", `shopping.saveFailed` "Couldn't save \"{item}\". We'll try again when you're back online.", `shopping.retry` "Retry", `shopping.fromMeals` "From this week's meals".

## States

- **Empty** (drawn): subtitle "Nothing to buy yet"; EmptyState with cart icon, title, text and secondary button "Add from this week's meals".
- **Offline and error** (drawn): warning banner at the top with the wifi-off icon; "Last updated 10 min ago"; items added offline show "Not saved yet" (`warning` badge); inverse Toast (`text` background, `bg` text) with alert icon and a "Retry" button.
- **Live update**: changes from others appear in under 2 s (FR-SHOP-003), highlighted briefly and announced politely ("Marcos added milk").
- **Delete item**: swipe or menu → hidden at once with a 5-second undo toast (ADR-009).
- **Finish shopping**: confirm sheet that clears checked items; in M4 it can also record the expense (FR-INT-003).
- **Loading**: skeleton rows.

## Accessibility

Checkboxes are real inputs with the item name and quantity as label. Presence avatars have names. Live announcements are polite and batched.
