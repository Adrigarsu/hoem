# M2 Shopping

Shared and private shopping lists with live updates. Tracking issue: #35. Create these issues when
M1b is close to done. Instructions and conventions: `README.md` in this folder.

| Variable        | Issue                                                  | Priority | Blocked by       |
| --------------- | ------------------------------------------------------ | -------- | ---------------- |
| `$SHOP_LIST`    | FR-SHOP-001: add, edit, check and remove items         | must     | —                |
| `$SHOP_GROUPS`  | FR-SHOP-002: items grouped by category                 | must     | `$SHOP_LIST`     |
| `$SHOP_LIVE`    | FR-SHOP-003: live updates between members              | must     | `$SHOP_LIST`     |
| `$SHOP_CLEAR`   | FR-SHOP-004: clear checked items when the shop is done | must     | `$SHOP_LIST`     |
| `$SHOP_PRIVATE` | FR-HH-005: private shopping lists                      | must     | `$SHOP_LIST`     |
| `$SHOP_OPENAPI` | chore: generate the OpenAPI document from the schemas  | should   | `$SHOP_LIST`     |
| `$SHOP_DOCS`    | docs: M2 documentation review                          | must     | all of the above |

## Setup

```bash
REPO=Adrigarsu/hoem
MILESTONE="M2 Shopping"
BODY=$(mktemp)
add_blocks() {
  gh issue view "$1" --repo "$REPO" --json body -q .body > "$BODY"
  printf 'Blocks: %s\n' "$2" >> "$BODY"
  gh issue edit "$1" --repo "$REPO" --body-file "$BODY" > /dev/null && echo "#$1 blocks $2"
}
```

## 1. FR-SHOP-001: add, edit, check and remove items

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-SHOP-001, NFR-UX-002, NFR-UX-003

### User story

As a household member
I want to add, edit, check and remove items on our shopping list
so that everyone knows what to buy.

### Acceptance criteria

```gherkin
Feature: Shopping list

  Scenario: Add an item (FR-SHOP-001)
    Given I am on the shopping list of my household
    When I add "Milk" with quantity 2 and unit "l" in category "Dairy"
    Then the item appears on the list

  Scenario: Edit an item (FR-SHOP-001)
    Given the list has "Milk — 2 l"
    When I change the quantity to 3
    Then the list shows "Milk — 3 l"

  Scenario: Check an item (FR-SHOP-001)
    Given the list has "Milk"
    When I check it
    Then it is marked as bought with who checked it, and I can uncheck it

  Scenario: Remove an item with undo (NFR-UX-002)
    Given the list has "Milk"
    When I remove it
    Then it disappears at once and a toast offers "Undo" for 5 seconds
    And after 5 seconds it is deleted for real

  Scenario: Empty list (NFR-UX-003)
    Given the list has no items
    Then I see "Nothing to buy yet" and how to add the first item

  Scenario: Another household's list stays hidden (NFR-SEC-001)
    Given I am not a member of "Calle Mayor flat"
    When I request its shopping list
    Then I get "not found"
```

### Priority (MoSCoW)

Must

### Area

Shopping

### Notes

- Screen: `docs/design-system/screens/shopping.md` (mobile and desktop, empty, loading and error
  states). The offline banner is drawn but offline support is phase 3 (FR-PWA-001): show the error
  state only.
- Data: `shopping_lists` and `shopping_items` (`docs/architecture.md` §6.3) with RLS in the same
  migration, merged first in its own pull request (ADR-014). Every household gets one shared list.
- REST: `GET/POST …/shopping-lists`, `POST …/items`, `PATCH/DELETE …/items/{itemId}`
  (`docs/architecture.md` §5.5). The `DELETE` route also serves the keepalive request of the undo
  (ADR-020).
- Replaces the "Coming soon" state of the Shopping tab and the Home tile link.
MD
printf '\nBlocked by: —\n' >> "$BODY"
SHOP_LIST=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-SHOP-001: add, edit, check and remove shopping list items" \
  --label "type:feature,area:shopping,priority:must" \
  --body-file "$BODY") && echo "$SHOP_LIST" && SHOP_LIST=${SHOP_LIST##*/}
````

## 2. FR-SHOP-002: items grouped by category

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-SHOP-002

### User story

As a member doing the shopping
I want the items grouped by category
so that I can pick up everything in one aisle at a time.

### Acceptance criteria

```gherkin
Feature: Categories

  Scenario: Grouped list (FR-SHOP-002)
    Given the list has "Milk" in Dairy, "Apples" in Produce and "Yoghurt" in Dairy
    Then I see a Produce group with "Apples" and a Dairy group with "Milk" and "Yoghurt"
    And each group heading is a real heading that screen readers can jump to

  Scenario: Fixed order
    Then groups follow the order of the shopping_category type, and empty groups are not shown

  Scenario: Checked items
    Given I check "Apples"
    Then it moves to the end of its group, still visible until the list is cleared
```

### Priority (MoSCoW)

Must

### Area

Shopping

### Notes

Categories are the `shopping_category` enum (`docs/architecture.md` §6.2); their labels come from
`messages/en.json`. A new item defaults to "Other". Category colour is never the only signal: each
group has its name.
MD
printf '\nBlocked by: #%s\n' "$SHOP_LIST" >> "$BODY"
SHOP_GROUPS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-SHOP-002: group shopping list items by category" \
  --label "type:feature,area:shopping,priority:must" \
  --body-file "$BODY") && echo "$SHOP_GROUPS" && SHOP_GROUPS=${SHOP_GROUPS##*/}
````

## 3. FR-SHOP-003: live updates between members

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-SHOP-003, NFR-PERF-003

### User story

As a flatmate
I want to see what the others add or check while I am in the shop
so that we never buy the same thing twice.

### Acceptance criteria

```gherkin
Feature: Live shopping list

  Scenario: An item added by someone else appears (FR-SHOP-003, NFR-PERF-003)
    Given Lucía and Marcos have the shared list open
    When Marcos adds "Bread"
    Then Lucía sees "Bread" within 2 seconds, without reloading

  Scenario: Changes are announced politely
    When Marcos checks "Milk"
    Then Lucía's list updates and a polite live region says "Marcos checked milk"

  Scenario: Private changes never travel (FR-HH-005, NFR-SEC-001)
    Given Marcos has a private list
    When he adds an item to it
    Then Lucía receives no update about it

  Scenario: Presence
    Given Marcos is on the list
    Then Lucía sees "Marcos is on this list"
```

### Priority (MoSCoW)

Must

### Area

Shopping

### Notes

- Supabase Realtime on `shopping_items` filtered by `list_id`, merged into the TanStack Query cache
  (`docs/architecture.md` §8.4). Realtime checks RLS before sending each change.
- ADR-016 keeps the session only in HttpOnly cookies, so the browser has no token for Realtime:
  this issue decides how it gets a short-lived one, and records it in an ADR.
- E2E with two browser contexts proves NFR-PERF-003.
MD
printf '\nBlocked by: #%s\n' "$SHOP_LIST" >> "$BODY"
SHOP_LIVE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-SHOP-003: live shopping list updates between members" \
  --label "type:feature,area:shopping,priority:must" \
  --body-file "$BODY") && echo "$SHOP_LIVE" && SHOP_LIVE=${SHOP_LIVE##*/}
````

## 4. FR-SHOP-004: clear checked items

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-SHOP-004, NFR-UX-002

### User story

As the member who did the shopping
I want to clear every checked item in one action
so that the list only shows what is still missing.

### Acceptance criteria

```gherkin
Feature: Finish shopping

  Scenario: Clear checked items (FR-SHOP-004)
    Given the list has 5 items and 3 are checked
    When I choose "Finish shopping" and confirm
    Then the 3 checked items are removed and the other 2 stay

  Scenario: Undo (NFR-UX-002)
    When I have just cleared the checked items
    Then a toast offers "Undo" for 5 seconds and brings them back

  Scenario: Nothing checked
    Given no item is checked
    Then "Finish shopping" is disabled and says why
```

### Priority (MoSCoW)

Must

### Area

Shopping

### Notes

The confirm sheet is drawn in `shopping.md` ("Finish shopping"). M4 adds "record the total as an
expense" to the same sheet (FR-INT-003): leave room for it, do not build it here. REST:
`POST …/shopping-lists/{listId}/finish`.
MD
printf '\nBlocked by: #%s\n' "$SHOP_LIST" >> "$BODY"
SHOP_CLEAR=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-SHOP-004: clear checked items when the shopping is done" \
  --label "type:feature,area:shopping,priority:must" \
  --body-file "$BODY") && echo "$SHOP_CLEAR" && SHOP_CLEAR=${SHOP_CLEAR##*/}
````

## 5. FR-HH-005: private shopping lists

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-HH-005, NFR-SEC-001

### User story

As a member of a family or a shared flat
I want a private shopping list next to the shared one
so that I can note my own things without the rest of the household seeing them.

### Acceptance criteria

```gherkin
Feature: Private shopping lists

  Scenario: Create a private list (FR-HH-005)
    Given I am a member of a shared flat
    When I create the private list "My things"
    Then I can switch between "Shared" and "My things"

  Scenario: Nobody else sees it (FR-HH-005, NFR-SEC-001)
    Given I have a private list
    When Marcos opens the shopping lists
    Then he does not see it, and requesting it directly returns "not found"

  Scenario: Families have them too (FR-HH-005)
    Given I am a child in a family household
    Then I can create a private shopping list, and my parents cannot see it

  Scenario: Single-person households (FR-HH-001)
    Given my household is a single person
    Then there is only one list and no switcher

  Scenario: "Other" households follow their setting
    Given an "other" household with private shopping lists turned off
    Then members cannot create one
```

### Priority (MoSCoW)

Must

### Area

Shopping

### Notes

`shopping_lists.owner_id` is set only for private lists; visibility is decided at write time
(ADR-006). The household setting `privateShoppingLists` (`householdSettingsSchema`) decides who can
create one. Policy tests sign in as owner, member, parent, child and relative. The meal-plan
clause of FR-HH-005 is proved in M3.
MD
printf '\nBlocked by: #%s\n' "$SHOP_LIST" >> "$BODY"
SHOP_PRIVATE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-HH-005: private shopping lists in families and shared flats" \
  --label "type:feature,area:shopping,area:households,priority:must" \
  --body-file "$BODY") && echo "$SHOP_PRIVATE" && SHOP_PRIVATE=${SHOP_PRIVATE##*/}
````

## 6. chore: generate the OpenAPI document

```bash
cat > "$BODY" <<'MD'
### Kind of work

Chore

### Description

`docs/architecture.md` §5.4 promises an OpenAPI 3.1 document generated from the Zod schemas,
served at `/api/v1/openapi.json` and rendered at `/api/docs`, with a CI step that fails when a
route has no schema. Today there are only a few routes; M2 adds the shopping ones, so this is the
cheapest moment to start.

### Done when

- [ ] Every route in `src/app/api/v1` registers its request and response schemas
      (`@asteasolutions/zod-to-openapi` or an equivalent chosen in an ADR)
- [ ] `/api/v1/openapi.json` serves the document, and `/api/docs` renders it
- [ ] CI fails when a route has no schema (`docs/architecture.md` §9.2, row 4)
- [ ] `docs/guides/` explains how to document a new route

### Related requirement IDs

NFR-SEC-002

### Notes

Problem Details responses (RFC 9457) are part of every route's documented errors.
MD
printf '\nBlocked by: #%s\n' "$SHOP_LIST" >> "$BODY"
SHOP_OPENAPI=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: generate the OpenAPI document from the Zod schemas" \
  --label "type:chore,area:platform,priority:should" \
  --body-file "$BODY") && echo "$SHOP_OPENAPI" && SHOP_OPENAPI=${SHOP_OPENAPI##*/}
```

## 7. docs: M2 documentation review

```bash
cat > "$BODY" <<'MD'
### Documents affected

docs/features/shopping.md, docs/guides/*.md, docs/architecture.md, docs/adr/README.md, docs/roadmap.md, docs/planning.md

### Description

Close M2 with documentation that matches the code: the shopping feature page, any guide whose
steps changed, and the architecture and ADRs touched by real time and private lists.

### Done when

- [ ] `docs/features/shopping.md`: what it does, privacy rules, requirement IDs and screens
- [ ] `docs/architecture.md` §5.5, §6 and §8.4 match the code; new ADRs are in the index
- [ ] The guides in `docs/guides/` match the commands and steps M2 changed
- [ ] `docs/roadmap.md`: M2 marked done, M3 exit criteria reviewed
- [ ] `docs/planning.md` has the M3 issues placed, created from `docs/milestones/m3-meals-recipes.md`
- [ ] Every link in `docs/` resolves

### Related requirement IDs

FR-SHOP-001, FR-SHOP-002, FR-SHOP-003, FR-SHOP-004, FR-HH-005

### Notes

Closes the milestone: the tracking issue #35 can be closed once every item on it is linked to a
closed story.
MD
printf '\nBlocked by: #%s, #%s, #%s, #%s, #%s, #%s\n' "$SHOP_LIST" "$SHOP_GROUPS" "$SHOP_LIVE" "$SHOP_CLEAR" "$SHOP_PRIVATE" "$SHOP_OPENAPI" >> "$BODY"
SHOP_DOCS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "docs: M2 documentation review" \
  --label "type:docs,area:platform,priority:must" \
  --body-file "$BODY") && echo "$SHOP_DOCS" && SHOP_DOCS=${SHOP_DOCS##*/}
```

## Blocks

```bash
add_blocks "$SHOP_LIST" "#$SHOP_GROUPS, #$SHOP_LIVE, #$SHOP_CLEAR, #$SHOP_PRIVATE, #$SHOP_OPENAPI, #$SHOP_DOCS"
for n in "$SHOP_GROUPS" "$SHOP_LIVE" "$SHOP_CLEAR" "$SHOP_PRIVATE" "$SHOP_OPENAPI"; do
  add_blocks "$n" "#$SHOP_DOCS"
done
add_blocks "$SHOP_DOCS" "—"
```

## Tracking issue

```bash
gh issue comment 35 --repo "$REPO" --body "Split into: #$SHOP_LIST, #$SHOP_GROUPS, #$SHOP_LIVE, #$SHOP_CLEAR, #$SHOP_PRIVATE, #$SHOP_OPENAPI and #$SHOP_DOCS."
```

Then ask Claude Code: "add the M2 issues to the planning".
