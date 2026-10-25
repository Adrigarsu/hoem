# Expenses

**Reference:** `expenses.html` · **Requirements:** FR-EXP-001 to 008, FR-HH-002 to 004, FR-HH-008, ADR-006, ADR-007 · **Issue:** M4 · **Route:** `/expenses`

## Layout — mobile (360 px)

1. Avatar button top right.
2. Header: `h1` "Expenses", "October 2026" (month picker on tap), primary IconButton "Add expense".
3. Filter (segmented, `aria-label="Filter expenses"`): All · Shared · Private.
4. **Budgets this month** card: two rows, each with label, "spent / limit" and a progress bar with an accessible label:
   - Shared — €412.60 / €600 — "69% of the shared budget used" (`expenses` fill).
   - Your private — €48.20 / €150 — "32% of your private budget used".
5. **Balance** card: "You owe Marcos" + "€23.40" (20/28, 700) and secondary button "Settle up".
6. Section "Recent": expense rows — description (16/24, 600), "payer · date" (14/20, `text-secondary`), amount right (tabular numbers) and a visibility Badge under it:
   - Headphones — You · Tue 6 Oct — €48.20 — Private
   - Weekly shop — You · Mon 5 Oct — €86.40 — Shared
   - Takeaway dinner — Marcos · Sat 3 Oct — €32.00 — Shared
7. Tab bar with Expenses current.

## Layout — desktop (1440 px)

Sidebar (Expenses current). Header: `h1` "Expenses", "October 2026", filter, primary "Add expense". Three cards in a row: **Shared budget** (€412.60 / €600 + bar), **Your private budget** (€48.20 / €150 + bar), **Balance** (€23.40, "You owe Marcos", "Settle up"). Then a Card with `h2` "All expenses" and a table: Description, Category, Paid by, Date, Visibility (Badge), Amount (right-aligned).

## Family household, parent view (drawn)

Subtitle "García family · October". Info note under the header (`brand-tint`): "As a parent, you also see your children's private expenses. They're told about this when they add one." The filter adds one chip per child (Pablo, Sara). A child's private expense shows the Badge "Private · Pablo". No balance card when splitting is off.

## Components

SegmentedControl, Card, Metric, ProgressBar, ExpenseRow, Badge, Table (desktop), Button, IconButton, Note.

## Texts

`expenses.title`, `expenses.add` "Add expense", filters, `expenses.budgets` "Budgets this month", `expenses.shared` "Shared", `expenses.yourPrivate` "Your private", `expenses.ofLimit` "{spent} / {limit}", `expenses.budgetUsed` "{percent}% of the {kind} budget used", `expenses.youOwe` "You owe {name}", `expenses.owesYou` "{name} owes you", `expenses.settleUp` "Settle up", `expenses.recent` "Recent", `expenses.all` "All expenses", table headers, `expenses.parentNote`, `expenses.privateOf` "Private · {name}".

## States

- **Empty month**: EmptyState "No expenses in October" + primary "Add expense".
- **Budget at 80 % / 100 %**: the bar turns `warning` / `danger` and the text says "Almost at your budget" / "Over budget by €12.40" (not colour alone).
- **No budget set**: the row shows "No budget" and a link "Set a budget".
- **All settled**: balance card says "You're all square".
- **Loading**: skeleton cards and rows.
- **Deleted expense**: undo toast, 5 s.

## Mobile vs desktop

Desktop shows the full table and puts budgets and balance side by side; mobile shows the 20 most recent and loads more on scroll.

## Accessibility

Amounts use `Intl.NumberFormat` and tabular numbers. Progress bars have `role="progressbar"` with value text. Private rows never show other members' private expenses unless the RLS rules allow it (parents in families).
