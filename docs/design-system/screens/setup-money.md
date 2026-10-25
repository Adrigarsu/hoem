# Setup guide: step 3, money

**Reference:** `setup-money.html` · **Requirements:** FR-ONB-004, FR-HH-009, ADR-007 · **Issue:** M1-20 · **Route:** `/setup/money`

## Layout — mobile (360 px)

Same frame (progress "Step 3 of 4", fixed footer Back / Continue).

1. `h1` "Money" + "Only shared expenses count here. Everyone's private expenses stay private."
2. Select "Currency": Euro (€), Pound (£), US dollar ($). Default Euro.
3. Field "Monthly shared budget (optional)" with the currency symbol as a prefix inside the input (`inputmode=decimal`).
4. Switch row "Split shared expenses equally" with the description "On by default for shared flats. HØEM will keep track of who owes whom."

## Layout — desktop

Centred column, max 480 px.

## Components

StepProgress, Select, Input with prefix, Switch row, Button.

## Texts

`setup.money.title` "Money", `setup.money.lede`, `setup.money.currency` "Currency", `setup.money.budget` "Monthly shared budget (optional)", `setup.money.split` "Split shared expenses equally", `setup.money.splitHelp`.

## States

- **Single-person household**: the split switch is hidden (FR-ONB-007).
- **Family**: the switch is off by default and only parents can change it (FR-HH-009).
- **Budget**: stored in cents (450.50 → 45050). Invalid amount: "Enter an amount like 450 or 450.50."

## Accessibility

The switch is `role="switch"` with its visible label; the prefix "€" is `aria-hidden` and the currency is in the label text for screen readers ("Monthly shared budget in euros").
