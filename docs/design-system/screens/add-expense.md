# Add expense

**Reference:** `add-expense.html` · **Requirements:** FR-EXP-001, FR-EXP-002, FR-EXP-005, FR-HH-002 to 004, ADR-006, ADR-007 · **Issue:** M4 · **Route:** none (sheet on mobile, dialog on desktop, opened from Expenses or Home)

## Layout — mobile (360 px), shared flat (drawn)

Bottom sheet over `scrim`, top 56 px, `surface`, top corners `radius-xl`, padding `space-3` `space-6` `space-8`, gap 14 px.

1. Drag handle; title row: `h1` "Add expense" and IconButton "Close".
2. Field "Amount": 56 px input with the currency symbol as prefix, value 24/32 bold, `inputmode=decimal`.
3. Field "Description".
4. Two selects side by side: "Category" (Groceries, Home, Eating out, Leisure, …) and "Paid by" (You, Marcos).
5. Fieldset "Who can see it?": two radio cards — **Shared** (users icon) "Everyone sees it; counts in the budget" · **Private** (lock icon) "Only you can see it". Selected: 2 px `brand` border, `brand-tint` background.
6. Info line (`surface-subtle`): "Split equally: €43.20 each for you and Marcos." (only for shared expenses when splitting is on).
7. Primary button, full width: "Save expense".

## Child in a family household (drawn)

Shorter sheet: Amount, Description, a two-option segmented "Shared / Private" (Private selected), and a `warning` note: "Your parents can still see your private expenses. Your brother or sister can't." No "Paid by" and no split line.

## Layout — desktop

Centred Dialog, 480 px wide, same fields; Escape closes it.

## Components

Sheet / Dialog, Field + Input with prefix, Select, RadioCard, SegmentedControl, Note, Button, IconButton.

## Texts

`expense.add.title` "Add expense", `expense.add.close` "Close", `expense.amount` "Amount", `expense.description` "Description", `expense.category` "Category", category names, `expense.paidBy` "Paid by", `expense.visibility` "Who can see it?", `expense.shared` / `expense.sharedHelp`, `expense.private` / `expense.privateHelp`, `expense.split` "Split equally: {amount} each for {names}.", `expense.childNote`, `expense.save` "Save expense".

## States

- **Validation**: amount > 0 with at most 2 decimals (stored in cents); description required (max 80).
- **Uneven split**: the leftover cent goes to the payer; the info line says it ("€43.21 for you, €43.20 for Marcos").
- **Saving / error**: spinner; Alert `danger` inside the sheet with retry; the sheet stays open with the data.
- **Success**: sheet closes, Toast "Expense saved" with "Undo".

## Accessibility

Focus starts on Amount; focus is trapped in the sheet and returns to the opener on close. The privacy consequence is always written next to the choice.
