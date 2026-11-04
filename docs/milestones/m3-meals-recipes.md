# M3 Meals & recipes

Recipes, the daily meal plan and the recipe-to-shopping-list integration. Tracking issue: #36.
Create these issues when M2 is close to done. Instructions and conventions: `README.md` in this
folder.

| Variable        | Issue                                                | Priority | Blocked by                    |
| --------------- | ---------------------------------------------------- | -------- | ----------------------------- |
| `$MEAL_RECIPES` | FR-MEAL-001: create, edit and delete recipes         | must     | —                             |
| `$MEAL_SEARCH`  | FR-MEAL-002: search recipes and filter by tag        | must     | `$MEAL_RECIPES`               |
| `$MEAL_PLAN`    | FR-MEAL-003: the meal plan by day and by week        | must     | —                             |
| `$MEAL_ASSIGN`  | FR-MEAL-004: put a recipe in a meal slot             | must     | `$MEAL_RECIPES`, `$MEAL_PLAN` |
| `$MEAL_TO_LIST` | FR-INT-001: add a recipe's ingredients to the list   | must     | `$MEAL_RECIPES`               |
| `$MEAL_SERVE`   | FR-MEAL-005: adjust servings of a planned meal       | should   | `$MEAL_ASSIGN`                |
| `$MEAL_SLOTS`   | FR-MEAL-007: hide the meal slots the household skips | should   | `$MEAL_PLAN`                  |
| `$MEAL_DOCS`    | docs: M3 documentation review                        | must     | all of the above              |

## Setup

```bash
REPO=Adrigarsu/hoem
MILESTONE="M3 Meals & recipes"
BODY=$(mktemp)
add_blocks() {
  gh issue view "$1" --repo "$REPO" --json body -q .body > "$BODY"
  printf 'Blocks: %s\n' "$2" >> "$BODY"
  gh issue edit "$1" --repo "$REPO" --body-file "$BODY" > /dev/null && echo "#$1 blocks $2"
}
```

## 1. FR-MEAL-001: create, edit and delete recipes

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-MEAL-001, NFR-UX-002, NFR-UX-003

### User story

As a household member
I want to keep our recipes in HØEM, with a photo, ingredients and steps
so that anyone at home can cook them and plan them.

### Acceptance criteria

```gherkin
Feature: Recipes

  Scenario: Create a recipe (FR-MEAL-001)
    Given I am on Meals
    When I create "Lentil stew" with 4 servings, 40 minutes, the ingredients "Lentils 300 g" and "Carrot 2 unit" and two steps
    Then every household member sees the recipe

  Scenario: Validation (FR-MEAL-001)
    When I save a recipe without a name, without ingredients or with a quantity of 0
    Then each field shows its error next to it and nothing is saved

  Scenario: Photo (FR-MEAL-001)
    When I add a JPEG, PNG or WebP photo up to 5 MB
    Then the recipe shows it, and a larger file or another format shows an error under the photo

  Scenario: Delete with undo (NFR-UX-002)
    When I delete a recipe
    Then it disappears at once and a toast offers "Undo" for 5 seconds

  Scenario: No recipes yet (NFR-UX-003)
    Given the household has no recipes
    Then Meals explains how to create the first one
```

### Priority (MoSCoW)

Must

### Area

Meals

### Notes

- Screens: `recipe.md` and `recipe-edit.md` in `docs/design-system/screens/` (desktop not designed:
  mobile layout inside the desktop shell).
- Data: `recipes` and `recipe_ingredients` (`docs/architecture.md` §6.3), migration first (ADR-014).
- Photos in a private Storage bucket, reusing the pattern of the avatars bucket (#22); the photo is
  deleted with the recipe.
- Removing an ingredient in the editor is immediate with an undo toast; "Cancel" with unsaved
  changes asks "Discard changes?".
MD
printf '\nBlocked by: —\n' >> "$BODY"
MEAL_RECIPES=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-MEAL-001: create, edit and delete recipes" \
  --label "type:feature,area:meals,priority:must" \
  --body-file "$BODY") && echo "$MEAL_RECIPES" && MEAL_RECIPES=${MEAL_RECIPES##*/}
````

## 2. FR-MEAL-002: search recipes and filter by tag

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-MEAL-002

### User story

As a member planning the week
I want to search recipes by name and filter them by tag
so that I find a quick or vegetarian dinner in seconds.

### Acceptance criteria

```gherkin
Feature: Find a recipe

  Scenario: Search by name (FR-MEAL-002)
    Given the recipes "Lentil stew" and "Lemon chicken"
    When I search "len"
    Then I see "Lentil stew" only, and the result count is announced to screen readers

  Scenario: Filter by tag (FR-MEAL-002)
    Given "Lentil stew" is tagged "vegetarian"
    When I filter by "vegetarian"
    Then I see only vegetarian recipes

  Scenario: No results
    When nothing matches
    Then I see "No recipes match" and a way to clear the search
```

### Priority (MoSCoW)

Must

### Area

Meals

### Notes

The trigram index on `recipes.name` and the GIN index on `tags` are in the data model
(`docs/architecture.md` §6.3). Tags are free text, lower-cased on save.
MD
printf '\nBlocked by: #%s\n' "$MEAL_RECIPES" >> "$BODY"
MEAL_SEARCH=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-MEAL-002: search recipes by name and filter by tag" \
  --label "type:feature,area:meals,priority:must" \
  --body-file "$BODY") && echo "$MEAL_SEARCH" && MEAL_SEARCH=${MEAL_SEARCH##*/}
````

## 3. FR-MEAL-003: the meal plan by day and by week

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-MEAL-003, FR-HH-005

### User story

As a household member
I want to see what we eat each day, slot by slot, for a day or a whole week
so that nobody has to ask "what's for dinner?".

### Acceptance criteria

```gherkin
Feature: Meal plan

  Scenario: Five slots a day (FR-MEAL-003)
    Given I open Meals
    Then today shows breakfast, morning snack, lunch, afternoon snack and dinner

  Scenario: Day and week views (FR-MEAL-003)
    When I switch to the week view
    Then I see 7 days from Monday, and can move to the previous and next week

  Scenario: A meal without a recipe (FR-MEAL-003)
    When I write "Leftovers" in Tuesday's dinner
    Then the slot shows "Leftovers"

  Scenario: One plan for families (FR-HH-005)
    Given my household is a family
    Then there is one shared plan and no "My plan" option

  Scenario: Private plans in shared flats (FR-HH-005, NFR-SEC-001)
    Given my household is a shared flat
    When I add a meal to "My plan"
    Then my flatmates do not see it
```

### Priority (MoSCoW)

Must

### Area

Meals

### Notes

- Screen: `docs/design-system/screens/meals.md`. "Copy last week" is FR-MEAL-006 (Could): hide it.
- Data: `meal_plan_entries` with its unique key per household, owner, date and slot
  (`docs/architecture.md` §6.3). Days are `date`, shown in the user's time zone.
- REST: `GET …/meal-plan?from=&to=`, `PUT …/meal-plan/{date}/{slot}`.
- Replaces the "Coming soon" state of the Meals tab.
MD
printf '\nBlocked by: —\n' >> "$BODY"
MEAL_PLAN=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-MEAL-003: meal plan with five daily slots, by day and by week" \
  --label "type:feature,area:meals,area:households,priority:must" \
  --body-file "$BODY") && echo "$MEAL_PLAN" && MEAL_PLAN=${MEAL_PLAN##*/}
````

## 4. FR-MEAL-004: put a recipe in a meal slot

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-MEAL-004, NFR-A11Y-003

### User story

As a member planning the week
I want to drag a recipe into a meal slot, or do the same with the keyboard
so that planning takes seconds on any device.

### Acceptance criteria

```gherkin
Feature: Plan a recipe

  Scenario: Drag and drop (FR-MEAL-004)
    Given the week view and my recipes
    When I drag "Lentil stew" onto Wednesday's lunch
    Then Wednesday's lunch shows "Lentil stew"

  Scenario: Without dragging (FR-MEAL-004, NFR-A11Y-003)
    Given I use only the keyboard or a screen reader
    When I open Wednesday's lunch and choose "Lentil stew" from the list
    Then the slot shows it, and the change is announced

  Scenario: Replace or remove
    Given Wednesday's lunch has a recipe
    Then I can replace it, or remove it with a 5-second undo
```

### Priority (MoSCoW)

Must

### Area

Meals

### Notes

Dragging is an extra, never the only way (WCAG 2.2, 2.5.7 Dragging Movements). Touch targets stay
44 × 44 px in the week grid.
MD
printf '\nBlocked by: #%s, #%s\n' "$MEAL_RECIPES" "$MEAL_PLAN" >> "$BODY"
MEAL_ASSIGN=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-MEAL-004: put a recipe in a meal slot, by drag and drop or keyboard" \
  --label "type:feature,area:meals,accessibility,priority:must" \
  --body-file "$BODY") && echo "$MEAL_ASSIGN" && MEAL_ASSIGN=${MEAL_ASSIGN##*/}
````

## 5. FR-INT-001: add a recipe's ingredients to the shopping list

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-INT-001, FR-INT-002, US-INT-01

### User story

As a member
I want to add a recipe's ingredients to the shopping list
so that I don't have to type them one by one.

### Acceptance criteria

```gherkin
Feature: From recipe to shopping list

  Scenario: Review before adding (FR-INT-002, US-INT-01)
    Given a planned meal with a recipe
    When I choose "Add ingredients to shopping list"
    Then I see its ingredients with checkboxes, all ticked, and the list to add them to

  Scenario: Leave out what is at home (FR-INT-002, US-INT-01)
    Given I untick "Olive oil"
    When I confirm
    Then only the ticked ingredients are added

  Scenario: Merge with what is already there (FR-INT-001, US-INT-01)
    Given the list already has "Rice — 200 g"
    When I add a recipe that needs 300 g of rice
    Then the list shows a single item "Rice — 500 g"

  Scenario: Different units are not merged (FR-INT-001)
    Given the list has "Milk — 1 l"
    When I add a recipe that needs "Milk — 2 cup"
    Then both items stay, so nothing is converted wrongly

  Scenario: Undo
    Then a toast says "5 ingredients added to the shared list" with "Undo" and "Open list"
```

### Priority (MoSCoW)

Must

### Area

Integrations

### Notes

The merge rule is a pure domain function written test-first (same name, case-insensitive, and same
unit). Works from a recipe page and from a planned meal; the list can be shared or private
(FR-HH-005).
MD
printf '\nBlocked by: #%s\n' "$MEAL_RECIPES" >> "$BODY"
MEAL_TO_LIST=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-INT-001: add a recipe's ingredients to the shopping list" \
  --label "type:feature,area:integrations,area:meals,area:shopping,priority:must" \
  --body-file "$BODY") && echo "$MEAL_TO_LIST" && MEAL_TO_LIST=${MEAL_TO_LIST##*/}
````

## 6. FR-MEAL-005: adjust servings of a planned meal

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-MEAL-005

### User story

As a member cooking for guests
I want to change the servings of a planned meal
so that the ingredient quantities fit how many we are.

### Acceptance criteria

```gherkin
Feature: Servings

  Scenario: Scale the ingredients (FR-MEAL-005)
    Given "Lentil stew" serves 4 and needs "Lentils 300 g"
    When I plan it for 6 servings
    Then the planned meal shows "Lentils 450 g"

  Scenario: The recipe stays as it is
    Then the recipe itself still serves 4

  Scenario: The shopping list gets the scaled amounts (FR-INT-001)
    When I add the planned meal's ingredients to the list
    Then the scaled quantities are added
```

### Priority (MoSCoW)

Should

### Area

Meals

### Notes

Scaling is a domain function: quantities are `numeric(10,3)`, rounded to 3 decimals, and "unit"
quantities round up to whole units.
MD
printf '\nBlocked by: #%s\n' "$MEAL_ASSIGN" >> "$BODY"
MEAL_SERVE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-MEAL-005: adjust the servings of a planned meal" \
  --label "type:feature,area:meals,priority:should" \
  --body-file "$BODY") && echo "$MEAL_SERVE" && MEAL_SERVE=${MEAL_SERVE##*/}
````

## 7. FR-MEAL-007: hide the meal slots the household skips

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-MEAL-007

### User story

As a household that never has snacks
I want to hide the slots we do not use
so that the plan only shows our real meals.

### Acceptance criteria

```gherkin
Feature: Meal slots in use

  Scenario: Hide a slot (FR-MEAL-007)
    Given I am an owner or parent
    When I turn off "Morning snack" in the household settings
    Then no member sees that slot in the plan

  Scenario: Planned meals are kept
    Given Tuesday's morning snack has a meal
    When I hide the slot
    Then the meal is kept and comes back if I show the slot again
```

### Priority (MoSCoW)

Should

### Area

Meals

### Notes

Edits the same `mealSlots` household setting that setup step 2 creates (#33). Who can change it
follows the household's management rules (FR-HH-001).
MD
printf '\nBlocked by: #%s\n' "$MEAL_PLAN" >> "$BODY"
MEAL_SLOTS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-MEAL-007: hide the meal slots the household does not use" \
  --label "type:feature,area:meals,area:households,priority:should" \
  --body-file "$BODY") && echo "$MEAL_SLOTS" && MEAL_SLOTS=${MEAL_SLOTS##*/}
````

## 8. docs: M3 documentation review

```bash
cat > "$BODY" <<'MD'
### Documents affected

docs/features/meals.md, docs/features/shopping.md, docs/guides/*.md, docs/architecture.md, docs/adr/README.md, docs/roadmap.md, docs/planning.md

### Description

Close M3 with documentation that matches the code: the meals feature page, the integration with
shopping, and any guide or architecture section the milestone changed.

### Done when

- [ ] `docs/features/meals.md`: recipes, meal plan, privacy rules, requirement IDs and screens
- [ ] `docs/features/shopping.md` explains adding ingredients from a recipe (FR-INT-001, FR-INT-002)
- [ ] `docs/architecture.md` §5.5 and §6 match the code; new ADRs are in the index
- [ ] The guides in `docs/guides/` match the commands and steps M3 changed
- [ ] `docs/roadmap.md`: M3 marked done, M4 exit criteria reviewed
- [ ] `docs/planning.md` has the M4 issues placed, created from `docs/milestones/m4-expenses-budgets.md`
- [ ] Every link in `docs/` resolves

### Related requirement IDs

FR-MEAL-001, FR-MEAL-002, FR-MEAL-003, FR-MEAL-004, FR-MEAL-005, FR-MEAL-007, FR-INT-001, FR-INT-002

### Notes

Closes the milestone: the tracking issue #36 can be closed once every item on it is linked to a
closed story.
MD
printf '\nBlocked by: #%s, #%s, #%s, #%s, #%s, #%s, #%s\n' "$MEAL_RECIPES" "$MEAL_SEARCH" "$MEAL_PLAN" "$MEAL_ASSIGN" "$MEAL_TO_LIST" "$MEAL_SERVE" "$MEAL_SLOTS" >> "$BODY"
MEAL_DOCS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "docs: M3 documentation review" \
  --label "type:docs,area:platform,priority:must" \
  --body-file "$BODY") && echo "$MEAL_DOCS" && MEAL_DOCS=${MEAL_DOCS##*/}
```

## Blocks

```bash
add_blocks "$MEAL_RECIPES" "#$MEAL_SEARCH, #$MEAL_ASSIGN, #$MEAL_TO_LIST, #$MEAL_DOCS"
add_blocks "$MEAL_PLAN" "#$MEAL_ASSIGN, #$MEAL_SLOTS, #$MEAL_DOCS"
add_blocks "$MEAL_ASSIGN" "#$MEAL_SERVE, #$MEAL_DOCS"
for n in "$MEAL_SEARCH" "$MEAL_TO_LIST" "$MEAL_SERVE" "$MEAL_SLOTS"; do
  add_blocks "$n" "#$MEAL_DOCS"
done
add_blocks "$MEAL_DOCS" "—"
```

## Tracking issue

```bash
gh issue comment 36 --repo "$REPO" --body "Split into: #$MEAL_RECIPES, #$MEAL_SEARCH, #$MEAL_PLAN, #$MEAL_ASSIGN, #$MEAL_TO_LIST, #$MEAL_SERVE, #$MEAL_SLOTS and #$MEAL_DOCS."
```

Then ask Claude Code: "add the M3 issues to the planning".
