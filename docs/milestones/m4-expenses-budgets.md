# M4 Expenses & budgets

Shared and private expenses, splits, balances and budgets. Privacy between members matters most in
this milestone: every story here ships with policy tests. Tracking issue: #37. Create these issues
when M3 is close to done. Instructions and conventions: `README.md` in this folder.

| Variable       | Issue                                            | Priority | Blocked by                 |
| -------------- | ------------------------------------------------ | -------- | -------------------------- |
| `$EXP_DATA`    | FR-EXP-007: expenses and their privacy rules     | must     | —                          |
| `$EXP_ADD`     | FR-EXP-001: record an expense                    | must     | `$EXP_DATA`                |
| `$EXP_LIST`    | FR-EXP-002: list expenses by month, with filters | must     | `$EXP_ADD`                 |
| `$EXP_BUDGET`  | FR-EXP-003: shared and personal monthly budgets  | must     | `$EXP_DATA`                |
| `$EXP_SUMMARY` | FR-EXP-004: monthly summary per category         | must     | `$EXP_LIST`, `$EXP_BUDGET` |
| `$EXP_TRIP`    | FR-INT-003: record a shopping trip as an expense | must     | `$EXP_ADD`                 |
| `$EXP_SPLIT`   | FR-EXP-005: split an expense equally             | should   | `$EXP_ADD`                 |
| `$EXP_BALANCE` | FR-EXP-006: balances between members             | should   | `$EXP_SPLIT`               |
| `$EXP_DOCS`    | docs: M4 documentation review                    | must     | all of the above           |

## Setup

```bash
REPO=Adrigarsu/hoem
MILESTONE="M4 Expenses & budgets"
BODY=$(mktemp)
add_blocks() {
  gh issue view "$1" --repo "$REPO" --json body -q .body > "$BODY"
  printf 'Blocks: %s\n' "$2" >> "$BODY"
  gh issue edit "$1" --repo "$REPO" --body-file "$BODY" > /dev/null && echo "#$1 blocks $2"
}
```

## 1. FR-EXP-007: expenses and their privacy rules

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-007, FR-HH-002, FR-HH-004, FR-HH-007, FR-HH-008, NFR-SEC-001, US-HH-01

### User story

As a household member
I want my private expenses to be seen only by the people the household rules allow
so that I can track all my money in HØEM without exposing it.

### Acceptance criteria

```gherkin
Feature: Who sees an expense

  Scenario: Private stays with its creator in a shared flat (FR-HH-004, US-HH-01)
    Given my flatmate saves a private expense in our shared flat
    When I read the expenses as owner
    Then I do not get it, through the app or the API

  Scenario: Parents see their children's private expenses (FR-HH-002, US-HH-01)
    Given my son saves a private expense in our family
    When I read the expenses as a parent
    Then I get it, marked as his private expense

  Scenario: Children never see their parents' private expenses (FR-HH-002, US-HH-01)
    Given I save a private expense as a parent
    When my son reads the expenses
    Then he does not get it

  Scenario: Relatives (FR-HH-008)
    Given a relative in a family saves a private expense
    Then nobody else gets it, and the relative gets nobody else's private expenses

  Scenario: Changing the type never exposes the past (FR-HH-007)
    Given a child's private expense saved while the household was a shared flat
    When the household becomes a family
    Then the parents still do not get that expense

  Scenario: Private never counts for the household (FR-EXP-007)
    Then private expenses are left out of household totals, budgets and balances
```

### Priority (MoSCoW)

Must

### Area

Expenses

### Notes

- Database only, no screen: `expenses` and `expense_shares` with RLS in the same migration
  (`docs/architecture.md` §6.3 and §7.3), merged on its own before any code uses it (ADR-014).
- `visible_to_parents` is set by a trigger when the expense is written (ADR-006), never from the
  current household type.
- Policy tests in `supabase/tests/database/` sign in as owner, member, parent, child and relative,
  in every household type.
- Deleting an account deletes the user's private expenses (ADR-019), with a pgTAP test.
- Amounts are `bigint` cents with `check (amount_cents > 0)` (ADR-007).
MD
printf '\nBlocked by: —\n' >> "$BODY"
EXP_DATA=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-007: expenses and their privacy rules in the database" \
  --label "type:feature,area:expenses,area:households,priority:must" \
  --body-file "$BODY") && echo "$EXP_DATA" && EXP_DATA=${EXP_DATA##*/}
````

## 2. FR-EXP-001: record an expense

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-001, FR-HH-003, US-EXP-01

### User story

As a member of a family household
I want to record both household and personal expenses
so that I can track all my money in one app.

### Acceptance criteria

```gherkin
Feature: Add expense

  Scenario: A shared expense (FR-EXP-001, US-EXP-01)
    Given I did the family's weekly shop on Monday
    When I save €86.41 in Groceries, paid by me, as shared
    Then every member sees it and it counts in the household total

  Scenario: A private expense (FR-EXP-001, US-EXP-01)
    Given I bought a toy for myself on Tuesday
    When I save it as private
    Then only I see it and it does not count in the household total

  Scenario: A child is told the truth (FR-HH-003)
    Given I am a child in a family household
    When I mark an expense as private
    Then the form says clearly that my parents can still see it

  Scenario: Validation
    When I enter 0, a negative amount, more than 2 decimals or no description
    Then the field shows its error and nothing is saved

  Scenario: Undo
    When the expense is saved
    Then the sheet closes and a toast "Expense saved" offers "Undo"
```

### Priority (MoSCoW)

Must

### Area

Expenses

### Notes

- Screen: `docs/design-system/screens/add-expense.md` (sheet on mobile, dialog on desktop, child
  view drawn).
- Money is typed as text and parsed to integer cents in the domain, never through a float; shown
  with `formatMoney` (`src/lib/i18n/format.ts`).
- REST: `POST …/expenses`, `PATCH/DELETE …/expenses/{expenseId}`.
MD
printf '\nBlocked by: #%s\n' "$EXP_DATA" >> "$BODY"
EXP_ADD=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-001: record a shared or private expense" \
  --label "type:feature,area:expenses,priority:must" \
  --body-file "$BODY") && echo "$EXP_ADD" && EXP_ADD=${EXP_ADD##*/}
````

## 3. FR-EXP-002: list expenses by month, with filters

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-002, NFR-UX-002, NFR-UX-003

### User story

As a household member
I want to see the month's expenses and filter them
so that I know where the money went.

### Acceptance criteria

```gherkin
Feature: Expenses list

  Scenario: By month (FR-EXP-002)
    Given expenses in September and October
    When I open October
    Then I see October's expenses, newest first, and can move to other months

  Scenario: Filters (FR-EXP-002)
    When I filter by category "Groceries", payer "Marcos" or visibility "Private"
    Then only matching expenses are listed, and the active filters are announced

  Scenario: Parent view (US-HH-01)
    Given I am a parent and my son saved a private expense
    Then the list shows it labelled as his private expense, with text and not only colour

  Scenario: Empty month (NFR-UX-003)
    Given no expenses in October
    Then I see "No expenses in October" and "Add expense"

  Scenario: Delete with undo (NFR-UX-002)
    When I delete an expense
    Then it disappears at once with a 5-second undo
```

### Priority (MoSCoW)

Must

### Area

Expenses

### Notes

Screen: `docs/design-system/screens/expenses.md`, family parent view drawn. Months are calendar
`date`s in the user's time zone. Replaces the "Coming soon" state of the Expenses tab.
MD
printf '\nBlocked by: #%s\n' "$EXP_ADD" >> "$BODY"
EXP_LIST=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-002: list expenses by month and filter them" \
  --label "type:feature,area:expenses,priority:must" \
  --body-file "$BODY") && echo "$EXP_LIST" && EXP_LIST=${EXP_LIST##*/}
````

## 4. FR-EXP-003: shared and personal monthly budgets

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-003, FR-EXP-008

### User story

As a household member
I want a monthly budget for the household and another for myself
so that I notice before we spend too much.

### Acceptance criteria

```gherkin
Feature: Budgets

  Scenario: Shared budget (FR-EXP-003)
    Given I am an owner (or a parent in a family)
    When I set €600 for October, and €300 for Groceries
    Then every member sees the shared spending against those budgets

  Scenario: Only managers set the shared budget (FR-EXP-003)
    Given I am a member, child or relative
    Then I can see the shared budget but not change it

  Scenario: Personal budget (FR-EXP-008)
    When I set a personal budget of €150
    Then only I see my private spending against it

  Scenario: Warnings that are not only colour
    Given the shared spending reaches 80 % and then 100 %
    Then the bar says "Almost at your budget" and then "Over budget by €12.40"

  Scenario: No budget
    Then the row says "No budget" with a link "Set a budget"
```

### Priority (MoSCoW)

Must

### Area

Expenses

### Notes

The `budgets` table exists from setup step 3 (#33): `owner_id` null is the shared budget. REST:
`GET/PUT …/budgets/{month}`.
MD
printf '\nBlocked by: #%s\n' "$EXP_DATA" >> "$BODY"
EXP_BUDGET=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-003: shared and personal monthly budgets" \
  --label "type:feature,area:expenses,priority:must" \
  --body-file "$BODY") && echo "$EXP_BUDGET" && EXP_BUDGET=${EXP_BUDGET##*/}
````

## 5. FR-EXP-004: monthly summary per category

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-004, NFR-A11Y-005

### User story

As a household member
I want a simple summary of the month per category, for the household and for me
so that I see at a glance where the money goes.

### Acceptance criteria

```gherkin
Feature: Monthly summary

  Scenario: Household view (FR-EXP-004)
    When I open the household summary for October
    Then I see the totals per category of shared expenses only

  Scenario: Personal view (FR-EXP-004)
    When I switch to my personal view
    Then I see my private expenses plus my share of shared ones

  Scenario: The chart is readable without colour (NFR-A11Y-005)
    Then every category has its name and amount as text, and the same data is available as a table
```

### Priority (MoSCoW)

Must

### Area

Expenses

### Notes

Totals are computed in the domain from cents, test-first. "My share" uses `expense_shares` when an
expense is split (FR-EXP-005); until then, a shared expense counts in full for whoever paid it.
MD
printf '\nBlocked by: #%s, #%s\n' "$EXP_LIST" "$EXP_BUDGET" >> "$BODY"
EXP_SUMMARY=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-004: monthly summary per category, household and personal" \
  --label "type:feature,area:expenses,priority:must" \
  --body-file "$BODY") && echo "$EXP_SUMMARY" && EXP_SUMMARY=${EXP_SUMMARY##*/}
````

## 6. FR-INT-003: record a shopping trip as an expense

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-INT-003

### User story

As the member who did the shopping
I want to record what I paid when I finish the shopping
so that the expense is saved without typing it again.

### Acceptance criteria

```gherkin
Feature: Shopping trip to expense

  Scenario: One step (FR-INT-003)
    Given I finish the shopping with 3 checked items
    When I enter €43.20 in the "Finish shopping" sheet and confirm
    Then the checked items are cleared and a shared Groceries expense of €43.20, paid by me, is saved

  Scenario: Optional
    When I leave the amount empty
    Then only the checked items are cleared

  Scenario: From a private list
    Given I finish my private list
    Then the expense is private by default
```

### Priority (MoSCoW)

Must

### Area

Integrations

### Notes

Extends the "Finish shopping" sheet of FR-SHOP-004 (M2). The default visibility follows the list's;
the member can change it before confirming.
MD
printf '\nBlocked by: #%s\n' "$EXP_ADD" >> "$BODY"
EXP_TRIP=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-INT-003: record a shopping trip as an expense in one step" \
  --label "type:feature,area:integrations,area:expenses,area:shopping,priority:must" \
  --body-file "$BODY") && echo "$EXP_TRIP" && EXP_TRIP=${EXP_TRIP##*/}
````

## 7. FR-EXP-005: split an expense equally

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-005, FR-HH-009

### User story

As a flatmate
I want to split a shared expense equally between the people it was for
so that each of us pays our part.

### Acceptance criteria

```gherkin
Feature: Split an expense

  Scenario: Equal split (FR-EXP-005)
    Given I paid €86.41 for Lucía and Marcos
    When I split it between both
    Then the shares are €43.21 for me and €43.20 for Marcos, and the sheet says so

  Scenario: The leftover cent goes to the payer (FR-EXP-005)
    Then the shares always add up to the expense, and the payer takes any leftover cent

  Scenario: Family rules (FR-HH-009)
    Given a family with splitting turned on
    Then splits are between the parents by default, and only authorised members can be included

  Scenario: Splitting off
    Given a single-person household, or a family with splitting off
    Then the split option is not shown
```

### Priority (MoSCoW)

Should

### Area

Expenses

### Notes

The split is a domain function written test-first (`split-expense.ts`). The family setting
`can_join_splits` exists (#30). `expense_shares` has a deferred check that shares add up.
MD
printf '\nBlocked by: #%s\n' "$EXP_ADD" >> "$BODY"
EXP_SPLIT=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-005: split a shared expense equally between members" \
  --label "type:feature,area:expenses,priority:should" \
  --body-file "$BODY") && echo "$EXP_SPLIT" && EXP_SPLIT=${EXP_SPLIT##*/}
````

## 8. FR-EXP-006: balances between members

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-EXP-006, FR-EXP-007

### User story

As a flatmate
I want to see who owes whom
so that we can settle up without a spreadsheet.

### Acceptance criteria

```gherkin
Feature: Balances

  Scenario: Who owes whom (FR-EXP-006)
    Given I paid €86.41 split with Marcos
    Then the balance says "Marcos owes you €43.20"

  Scenario: Shared expenses only (FR-EXP-006, FR-EXP-007)
    Then private expenses never change a balance

  Scenario: All square
    Given every balance is zero
    Then the card says "You're all square"
```

### Priority (MoSCoW)

Should

### Area

Expenses

### Notes

Balances are computed in the domain from `expense_shares`, test-first. REST: `GET …/balances`.
Settling up (payments between users) is out of scope (SRS §1.2).
MD
printf '\nBlocked by: #%s\n' "$EXP_SPLIT" >> "$BODY"
EXP_BALANCE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-EXP-006: balances between members" \
  --label "type:feature,area:expenses,priority:should" \
  --body-file "$BODY") && echo "$EXP_BALANCE" && EXP_BALANCE=${EXP_BALANCE##*/}
````

## 9. docs: M4 documentation review

```bash
cat > "$BODY" <<'MD'
### Documents affected

docs/features/expenses.md, docs/features/shopping.md, docs/features/households.md, docs/guides/*.md, docs/architecture.md, docs/adr/README.md, docs/roadmap.md, docs/planning.md

### Description

Close M4 with documentation that matches the code. The expense privacy rules are the most sensitive
in the product, so `docs/features/expenses.md` states exactly who sees what in each household type.

### Done when

- [ ] `docs/features/expenses.md`: expenses, budgets, splits, balances, the privacy table per
      household type, requirement IDs and screens
- [ ] `docs/features/shopping.md` explains recording a trip as an expense (FR-INT-003)
- [ ] `docs/architecture.md` §6 and §7.3 match the policies in the migrations
- [ ] The guides in `docs/guides/` match the commands and steps M4 changed
- [ ] `docs/roadmap.md`: M4 marked done, M5 exit criteria reviewed
- [ ] `docs/planning.md` has the M5 issues placed, created from `docs/milestones/m5-planner-notifications.md`
- [ ] Every link in `docs/` resolves

### Related requirement IDs

FR-EXP-001, FR-EXP-002, FR-EXP-003, FR-EXP-004, FR-EXP-005, FR-EXP-006, FR-EXP-007, FR-EXP-008, FR-HH-002, FR-HH-003, FR-HH-004, FR-INT-003

### Notes

Closes the milestone: the tracking issue #37 can be closed once every item on it is linked to a
closed story.
MD
printf '\nBlocked by: #%s, #%s, #%s, #%s, #%s, #%s, #%s, #%s\n' "$EXP_DATA" "$EXP_ADD" "$EXP_LIST" "$EXP_BUDGET" "$EXP_SUMMARY" "$EXP_TRIP" "$EXP_SPLIT" "$EXP_BALANCE" >> "$BODY"
EXP_DOCS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "docs: M4 documentation review" \
  --label "type:docs,area:platform,priority:must" \
  --body-file "$BODY") && echo "$EXP_DOCS" && EXP_DOCS=${EXP_DOCS##*/}
```

## Blocks

```bash
add_blocks "$EXP_DATA" "#$EXP_ADD, #$EXP_BUDGET, #$EXP_DOCS"
add_blocks "$EXP_ADD" "#$EXP_LIST, #$EXP_TRIP, #$EXP_SPLIT, #$EXP_DOCS"
add_blocks "$EXP_LIST" "#$EXP_SUMMARY, #$EXP_DOCS"
add_blocks "$EXP_BUDGET" "#$EXP_SUMMARY, #$EXP_DOCS"
add_blocks "$EXP_SPLIT" "#$EXP_BALANCE, #$EXP_DOCS"
for n in "$EXP_SUMMARY" "$EXP_TRIP" "$EXP_BALANCE"; do
  add_blocks "$n" "#$EXP_DOCS"
done
add_blocks "$EXP_DOCS" "—"
```

## Tracking issue

```bash
gh issue comment 37 --repo "$REPO" --body "Split into: #$EXP_DATA, #$EXP_ADD, #$EXP_LIST, #$EXP_BUDGET, #$EXP_SUMMARY, #$EXP_TRIP, #$EXP_SPLIT, #$EXP_BALANCE and #$EXP_DOCS."
```

Then ask Claude Code: "add the M4 issues to the planning".
