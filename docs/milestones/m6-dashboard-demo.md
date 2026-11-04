# M6 Dashboard & demo

The daily dashboard on Home and the no-account demo for people reviewing the project. Tracking
issue: #39. Create these issues when M5 is close to done. Instructions and conventions: `README.md`
in this folder.

FR-DASH-001 (greeting by name and time of day) is already built and tested
(`src/features/home/domain/greeting.ts`): the docs review only checks it.

| Variable        | Issue                                                 | Priority | Blocked by       |
| --------------- | ----------------------------------------------------- | -------- | ---------------- |
| `$DASH_TODAY`   | FR-DASH-002: today at a glance on Home                | must     | —                |
| `$DASH_FEED`    | FR-DASH-005: recent activity feed                     | should   | `$DASH_TODAY`    |
| `$DEMO_DATA`    | FR-DEMO-003: the demo template data                   | must     | —                |
| `$DEMO_START`   | FR-DEMO-001: try the demo without an account          | must     | `$DEMO_DATA`     |
| `$DEMO_LIMITS`  | FR-DEMO-005: demo banner and disabled outside actions | must     | `$DEMO_START`    |
| `$DEMO_CLEANUP` | FR-DEMO-007: delete demo copies after 24 hours        | must     | `$DEMO_START`    |
| `$DEMO_TWO`     | FR-DEMO-004: a family and a shared flat in the demo   | should   | `$DEMO_START`    |
| `$DEMO_RATE`    | FR-DEMO-008: rate-limit demo creation per IP address  | should   | `$DEMO_START`    |
| `$DASH_DOCS`    | docs: M6 documentation review                         | must     | all of the above |

## Setup

```bash
REPO=Adrigarsu/hoem
MILESTONE="M6 Dashboard & demo"
BODY=$(mktemp)
add_blocks() {
  gh issue view "$1" --repo "$REPO" --json body -q .body > "$BODY"
  printf 'Blocks: %s\n' "$2" >> "$BODY"
  gh issue edit "$1" --repo "$REPO" --body-file "$BODY" > /dev/null && echo "#$1 blocks $2"
}
```

## 1. FR-DASH-002: today at a glance on Home

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DASH-002, FR-DASH-003, FR-DASH-004, FR-NAV-002

### User story

As a household member opening HØEM in the morning
I want today's meals, what is missing at home and how our money is going on one screen
so that I know the day at a glance.

### Acceptance criteria

```gherkin
Feature: Home dashboard

  Scenario: Today's meals (FR-DASH-002)
    Given lunch and dinner are planned for today
    When I open Home
    Then the Meals tile shows today's planned meals slot by slot, in the slots the household uses

  Scenario: Shopping list (FR-DASH-003)
    Given 7 items are not checked yet
    Then the Shopping tile says "7 items to buy" and opens the list

  Scenario: Money (FR-DASH-004)
    Given €420 of shared spending this month against a €600 budget, and €80 of my own private spending
    Then the Expenses tile shows "€420 of €600" and, separately, "You: €80"

  Scenario: Private stays private (FR-DASH-004, NFR-SEC-001)
    Then the household figure never includes anyone's private expenses

  Scenario: A section fails
    Given the expenses cannot be loaded
    Then that tile says "Couldn't load this. Retry" and the rest of Home still renders

  Scenario: Empty modules
    Given nothing is planned or listed yet
    Then each tile turns into its next action ("Plan a meal", "Add an item", "No expenses yet")
```

### Priority (MoSCoW)

Must

### Area

Dashboard

### Notes

Screen: `docs/design-system/screens/home.md` (states drawn: loading with `aria-busy`, empty, error).
Each tile reads through the owning feature's `index.ts`; Home has no queries of its own. Each tile
loads in its own `<Suspense>` so one slow module does not block the page.
MD
printf '\nBlocked by: —\n' >> "$BODY"
DASH_TODAY=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DASH-002: today's meals, shopping and spending at a glance on Home" \
  --label "type:feature,area:dashboard,priority:must" \
  --body-file "$BODY") && echo "$DASH_TODAY" && DASH_TODAY=${DASH_TODAY##*/}
````

## 2. FR-DASH-005: recent activity feed

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DASH-005, NFR-SEC-001

### User story

As a household member
I want to see what the others did recently
so that I know "Lucía added milk" without asking.

### Acceptance criteria

```gherkin
Feature: Activity feed

  Scenario: Recent activity (FR-DASH-005)
    Given Lucía added milk and Marcos planned dinner
    Then Home shows "Lucía added milk" and "Marcos planned dinner", newest first

  Scenario: Private records never appear (FR-DASH-005, NFR-SEC-001)
    Given Marcos saved a private expense or added to his private list
    Then nothing about it appears in anyone's feed

  Scenario: Quiet household
    Then the feed says that nothing happened yet
```

### Priority (MoSCoW)

Should

### Area

Dashboard

### Notes

Data: `activity_events`, written only for shared records (`docs/architecture.md` §6.3), by the
services or a trigger. A policy test proves that no private record produces an event.
MD
printf '\nBlocked by: #%s\n' "$DASH_TODAY" >> "$BODY"
DASH_FEED=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DASH-005: recent activity feed on Home" \
  --label "type:feature,area:dashboard,priority:should" \
  --body-file "$BODY") && echo "$DASH_FEED" && DASH_FEED=${DASH_FEED##*/}
````

## 3. FR-DEMO-003: the demo template data

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DEMO-003

### User story

As someone trying the demo
I want a household that looks lived in
so that every module shows what it can do.

### Acceptance criteria

```gherkin
Feature: Demo template

  Scenario: Every module has data (FR-DEMO-003)
    Then the template has recipes, two weeks of planned meals, an active shopping list,
      a month of shared and private expenses with budgets, and some notes with reminders

  Scenario: Dates follow today
    Given someone starts the demo
    Then the planned meals and expenses are around the current date, not a fixed one

  Scenario: Never visible to real users (NFR-SEC-001)
    Then no real account can read the template household
```

### Priority (MoSCoW)

Must

### Area

Demo

### Notes

The template lives in `src/db/seed/` (demo template, `docs/architecture.md` §9.1) and is loaded
into production as a household no one is a member of. Uses the example people of the screens:
Lucía and Marcos in "Calle Mayor flat".
MD
printf '\nBlocked by: —\n' >> "$BODY"
DEMO_DATA=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DEMO-003: demo template data for every module" \
  --label "type:feature,area:demo,priority:must" \
  --body-file "$BODY") && echo "$DEMO_DATA" && DEMO_DATA=${DEMO_DATA##*/}
````

## 4. FR-DEMO-001: try the demo without an account

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DEMO-001, FR-DEMO-002, US-DEMO-01

### User story

As a recruiter reviewing a portfolio
I want to try HØEM without creating an account
so that I can judge the product quickly.

### Acceptance criteria

```gherkin
Feature: Try the demo

  Scenario: One click (FR-DEMO-001, US-DEMO-01)
    Given I open the sign-in screen
    When I choose "Try the demo"
    Then I land on a dashboard with realistic data within 3 seconds

  Scenario: My own copy (FR-DEMO-002, US-DEMO-01)
    Given I check items on the demo shopping list
    When another visitor opens the demo
    Then they see the original, unchanged list

  Scenario: Ending the demo
    When I sign out of the demo
    Then my copy is no longer reachable
```

### Priority (MoSCoW)

Must

### Area

Demo

### Notes

Supabase anonymous sign-in creates the session; a `security definer` database function copies the
template into the visitor's own household (ADR-011). The copy follows the same RLS as real data.
MD
printf '\nBlocked by: #%s\n' "$DEMO_DATA" >> "$BODY"
DEMO_START=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DEMO-001: try the demo without an account" \
  --label "type:feature,area:demo,priority:must" \
  --body-file "$BODY") && echo "$DEMO_START" && DEMO_START=${DEMO_START##*/}
````

## 5. FR-DEMO-005: demo banner and disabled outside actions

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DEMO-005, FR-DEMO-006, US-DEMO-01

### User story

As a visitor in the demo
I want to know I am in a demo and why some actions are off
so that I am never confused, and nobody gets e-mails from strangers.

### Acceptance criteria

```gherkin
Feature: Demo limits

  Scenario: Banner (FR-DEMO-005)
    Then every screen shows "This is a demo" with "Create your own account", above the header

  Scenario: Invitations are off (FR-DEMO-006, US-DEMO-01)
    When I press Invite
    Then the app explains that invitations are disabled in the demo

  Scenario: Account changes are off (FR-DEMO-006)
    When I try to change the e-mail or password, or delete the account
    Then the app explains why it is disabled, and the API answers demo_restricted
```

### Priority (MoSCoW)

Must

### Area

Demo

### Notes

The services throw `DemoRestrictedError` (`demo_restricted`, 403) for anonymous sessions; the UI
explains instead of hiding the action. Screen: the demo state of `home.md`; the avatar button must
sit below the banner, not over it.
MD
printf '\nBlocked by: #%s\n' "$DEMO_START" >> "$BODY"
DEMO_LIMITS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DEMO-005: demo banner and disabled outside actions" \
  --label "type:feature,area:demo,priority:must" \
  --body-file "$BODY") && echo "$DEMO_LIMITS" && DEMO_LIMITS=${DEMO_LIMITS##*/}
````

## 6. FR-DEMO-007: delete demo copies after 24 hours

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DEMO-007

### User story

As the owner of a free-tier project
I want demo copies to clean themselves up
so that the database does not fill with abandoned data.

### Acceptance criteria

```gherkin
Feature: Demo clean-up

  Scenario: After 24 hours (FR-DEMO-007)
    Given a demo copy created 25 hours ago
    When the clean-up job runs
    Then the copy, its files and its anonymous user are deleted

  Scenario: Recent copies stay
    Given a demo copy created 2 hours ago
    Then it is kept

  Scenario: Real data is never touched
    Then the job only deletes households created from the template by anonymous users
```

### Priority (MoSCoW)

Must

### Area

Demo

### Notes

The `cleanup-demo` scheduled job (`docs/architecture.md` §8.1), on the same `pg_cron` setup as the
reminders (M5). Tested with pgTAP against a copy whose creation time is moved back.
MD
printf '\nBlocked by: #%s\n' "$DEMO_START" >> "$BODY"
DEMO_CLEANUP=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DEMO-007: delete demo copies 24 hours after creation" \
  --label "type:feature,area:demo,priority:must" \
  --body-file "$BODY") && echo "$DEMO_CLEANUP" && DEMO_CLEANUP=${DEMO_CLEANUP##*/}
````

## 7. FR-DEMO-004: a family and a shared flat in the demo

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DEMO-004, FR-HH-001

### User story

As a visitor
I want to switch between a family and a shared flat in the demo
so that I see how the privacy rules change with the household type.

### Acceptance criteria

```gherkin
Feature: Two demo households

  Scenario: Switch (FR-DEMO-004)
    Given I am in the demo
    When I open the household switcher
    Then I can move between "Calle Mayor flat" and "García family"

  Scenario: The rules show (FR-DEMO-004, FR-HH-001)
    Then the family shows a child's private expense to the parent, and the flat never shows a flatmate's
```

### Priority (MoSCoW)

Should

### Area

Demo

### Notes

Adds the family to the template and to the copy function; the visitor is a parent there.
MD
printf '\nBlocked by: #%s\n' "$DEMO_START" >> "$BODY"
DEMO_TWO=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DEMO-004: a family and a shared flat in the demo" \
  --label "type:feature,area:demo,priority:should" \
  --body-file "$BODY") && echo "$DEMO_TWO" && DEMO_TWO=${DEMO_TWO##*/}
````

## 8. FR-DEMO-008: rate-limit demo creation per IP address

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-DEMO-008, NFR-SEC-006

### User story

As the owner of a free-tier project
I want to limit how many demos one address can start
so that nobody can fill the database on purpose.

### Acceptance criteria

```gherkin
Feature: Demo rate limit

  Scenario: Too many demos (FR-DEMO-008)
    Given an IP address started 10 demos in the last hour
    When it starts another one
    Then the app answers 429 with Retry-After, and the screen explains when to try again

  Scenario: Normal use
    Then a visitor who starts one or two demos never notices the limit
```

### Priority (MoSCoW)

Should

### Area

Demo

### Notes

Reuses the rate-limit counters in Postgres from #99 (10 demo sessions per hour per IP,
`docs/architecture.md` §5.5). The IP address is not stored longer than the window.
MD
printf '\nBlocked by: #%s\n' "$DEMO_START" >> "$BODY"
DEMO_RATE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-DEMO-008: rate-limit demo creation per IP address" \
  --label "type:feature,area:demo,priority:should" \
  --body-file "$BODY") && echo "$DEMO_RATE" && DEMO_RATE=${DEMO_RATE##*/}
````

## 9. docs: M6 documentation review

```bash
cat > "$BODY" <<'MD'
### Documents affected

docs/features/home.md, docs/features/demo.md, docs/guides/*.md, docs/architecture.md, docs/adr/README.md, docs/roadmap.md, docs/planning.md

### Description

Close M6 with documentation that matches the code: the dashboard, the demo and its clean-up job.

### Done when

- [ ] `docs/features/home.md`: the dashboard tiles, privacy rules, requirement IDs (FR-DASH-001 to
      005) and screens
- [ ] `docs/features/demo.md`: how the demo starts, what is disabled, when it is deleted
- [ ] `docs/guides/deployment.md`: loading the demo template into production and checking the
      clean-up job
- [ ] `docs/architecture.md` §8 matches the code; new ADRs are in the index
- [ ] `docs/roadmap.md`: M6 marked done, Gate B criteria reviewed
- [ ] `docs/planning.md` has the M7 issues placed, created from `docs/milestones/m7-release.md`
- [ ] Every link in `docs/` resolves

### Related requirement IDs

FR-DASH-001, FR-DASH-002, FR-DASH-003, FR-DASH-004, FR-DASH-005, FR-DEMO-001, FR-DEMO-002, FR-DEMO-003, FR-DEMO-004, FR-DEMO-005, FR-DEMO-006, FR-DEMO-007, FR-DEMO-008

### Notes

Closes the milestone: the tracking issue #39 can be closed once every item on it is linked to a
closed story.
MD
printf '\nBlocked by: #%s, #%s, #%s, #%s, #%s, #%s, #%s, #%s\n' "$DASH_TODAY" "$DASH_FEED" "$DEMO_DATA" "$DEMO_START" "$DEMO_LIMITS" "$DEMO_CLEANUP" "$DEMO_TWO" "$DEMO_RATE" >> "$BODY"
DASH_DOCS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "docs: M6 documentation review" \
  --label "type:docs,area:platform,priority:must" \
  --body-file "$BODY") && echo "$DASH_DOCS" && DASH_DOCS=${DASH_DOCS##*/}
```

## Blocks

```bash
add_blocks "$DASH_TODAY" "#$DASH_FEED, #$DASH_DOCS"
add_blocks "$DEMO_DATA" "#$DEMO_START, #$DASH_DOCS"
add_blocks "$DEMO_START" "#$DEMO_LIMITS, #$DEMO_CLEANUP, #$DEMO_TWO, #$DEMO_RATE, #$DASH_DOCS"
for n in "$DASH_FEED" "$DEMO_LIMITS" "$DEMO_CLEANUP" "$DEMO_TWO" "$DEMO_RATE"; do
  add_blocks "$n" "#$DASH_DOCS"
done
add_blocks "$DASH_DOCS" "—"
```

## Tracking issue

```bash
gh issue comment 39 --repo "$REPO" --body "Split into: #$DASH_TODAY, #$DASH_FEED, #$DEMO_DATA, #$DEMO_START, #$DEMO_LIMITS, #$DEMO_CLEANUP, #$DEMO_TWO, #$DEMO_RATE and #$DASH_DOCS. FR-DASH-001 was already built in M1a."
```

Then ask Claude Code: "add the M6 issues to the planning".
