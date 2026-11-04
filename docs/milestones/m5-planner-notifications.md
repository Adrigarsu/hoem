# M5 Planner & notifications

Notes, reminders, the installable app and push notifications. Tracking issue: #38. Create these
issues when M4 is close to done. Instructions and conventions: `README.md` in this folder.

| Variable        | Issue                                                | Priority | Blocked by                                     |
| --------------- | ---------------------------------------------------- | -------- | ---------------------------------------------- |
| `$NOTE_NOTES`   | FR-NOTE-001: create, edit, pin and delete notes      | must     | —                                              |
| `$NOTE_REMIND`  | FR-NOTE-003: reminders, once or repeating            | must     | `$NOTE_NOTES`                                  |
| `$NOTIF_PWA`    | FR-NOTIF-001: install HØEM as an app                 | must     | —                                              |
| `$NOTIF_CENTRE` | FR-NOTIF-003: the notification centre                | must     | —                                              |
| `$NOTIF_PUSH`   | FR-NOTIF-002: turn on push notifications             | must     | `$NOTIF_PWA`                                   |
| `$NOTE_SEND`    | FR-NOTE-004: send reminders to the chosen members    | must     | `$NOTE_REMIND`, `$NOTIF_CENTRE`, `$NOTIF_PUSH` |
| `$NOTE_HOME`    | FR-NOTE-005: pinned notes and next reminders on Home | must     | `$NOTE_REMIND`                                 |
| `$NOTE_SNOOZE`  | FR-NOTE-006: mark a reminder as done or snooze it    | should   | `$NOTE_SEND`                                   |
| `$NOTE_DOCS`    | docs: M5 documentation review                        | must     | all of the above                               |

## Setup

```bash
REPO=Adrigarsu/hoem
MILESTONE="M5 Planner & notifications"
BODY=$(mktemp)
add_blocks() {
  gh issue view "$1" --repo "$REPO" --json body -q .body > "$BODY"
  printf 'Blocks: %s\n' "$2" >> "$BODY"
  gh issue edit "$1" --repo "$REPO" --body-file "$BODY" > /dev/null && echo "#$1 blocks $2"
}
```

## 1. FR-NOTE-001: create, edit, pin and delete notes

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTE-001, FR-NOTE-002, NFR-UX-002, NFR-UX-003

### User story

As a household member
I want short notes, shared with the household or only for me
so that what the other modules do not cover still has a place.

### Acceptance criteria

```gherkin
Feature: Notes

  Scenario: Write a note (FR-NOTE-001)
    When I write "Water the plants" and save it
    Then it appears in the Planner

  Scenario: Up to 500 characters (FR-NOTE-001)
    When I type more than 500 characters
    Then the counter turns red with a text warning and I cannot save

  Scenario: Pin a note (FR-NOTE-001)
    When I pin a note
    Then it appears first

  Scenario: Shared or private (FR-NOTE-002, NFR-SEC-001)
    Given I save a private note
    Then nobody else in the household sees it, following the rules of the household type

  Scenario: Delete with undo (NFR-UX-002)
    When I delete a note
    Then it disappears at once with a 5-second undo

  Scenario: No notes yet (NFR-UX-003)
    Then I see "No notes yet" and "New note"
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

- Screens: `planner.md` and `note-edit.md` in `docs/design-system/screens/`.
- Data: `notes` with RLS in the same migration (`docs/architecture.md` §6.3), merged first
  (ADR-014). Private notes are deleted with their author's account (ADR-019).
- REST: `GET/POST …/notes`, `PATCH/DELETE …/notes/{noteId}`.
- Replaces the "Coming soon" state of the Planner tab.
MD
printf '\nBlocked by: —\n' >> "$BODY"
NOTE_NOTES=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTE-001: create, edit, pin and delete shared or private notes" \
  --label "type:feature,area:planner,priority:must" \
  --body-file "$BODY") && echo "$NOTE_NOTES" && NOTE_NOTES=${NOTE_NOTES##*/}
````

## 2. FR-NOTE-003: reminders, once or repeating

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTE-003

### User story

As a flatmate
I want to add a reminder to a note, once or repeating
so that I don't have to remember the rent myself.

### Acceptance criteria

```gherkin
Feature: Reminders

  Scenario: Once (FR-NOTE-003)
    When I add a reminder on 1 December at 09:00
    Then the note shows "1 Dec, 09:00"

  Scenario: Repeating (FR-NOTE-003)
    When I choose monthly on day 1 at 09:00
    Then the note shows "Every month on the 1st, 09:00"

  Scenario: Weekly on chosen days (FR-NOTE-003)
    When I choose weekly on Monday and Thursday
    Then the next occurrence is the next of those days

  Scenario: In the future only
    When I pick a start in the past
    Then the field shows an error

  Scenario: Daylight saving
    Given a daily reminder at 09:00 in Europe/Madrid
    Then it stays at 09:00 local time across the change of hour
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

- Repeating reminders are iCalendar rules (RFC 5545, ADR-008), such as `FREQ=MONTHLY;BYMONTHDAY=1`,
  stored with their time zone. The next occurrence is a domain function written test-first,
  across DST changes.
- Data: `reminders` with `next_fire_at` (`docs/architecture.md` §6.3). Sending them is
  FR-NOTE-004.
MD
printf '\nBlocked by: #%s\n' "$NOTE_NOTES" >> "$BODY"
NOTE_REMIND=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTE-003: add a reminder to a note, once or repeating" \
  --label "type:feature,area:planner,priority:must" \
  --body-file "$BODY") && echo "$NOTE_REMIND" && NOTE_REMIND=${NOTE_REMIND##*/}
````

## 3. FR-NOTIF-001: install HØEM as an app

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTIF-001

### User story

As a member who uses HØEM every day
I want to install it on my phone's home screen
so that it opens like an app and can receive notifications.

### Acceptance criteria

```gherkin
Feature: Installable app

  Scenario: Install (FR-NOTIF-001)
    Given I open hoemapp.com in Chrome on Android or Safari on iPhone
    Then the browser offers to install HØEM, with its name, icon and theme colour

  Scenario: Opens like an app (FR-NOTIF-001)
    When I open the installed app
    Then it starts at Home without the browser bar

  Scenario: Still a website
    Then nothing changes for people who do not install it
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

Web app manifest and a service worker. The service worker only handles push in the MVP; offline
reading is phase 3 (FR-PWA-001), so it caches nothing that could serve stale private data.
Icons from `docs/design-system/assets/logos/`.
MD
printf '\nBlocked by: —\n' >> "$BODY"
NOTIF_PWA=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTIF-001: install HØEM as an app (manifest and service worker)" \
  --label "type:feature,area:platform,priority:must" \
  --body-file "$BODY") && echo "$NOTIF_PWA" && NOTIF_PWA=${NOTIF_PWA##*/}
````

## 4. FR-NOTIF-003: the notification centre

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTIF-003, NFR-UX-003

### User story

As a member
I want a list of my recent notifications inside the app
so that I miss nothing when push is off or blocked.

### Acceptance criteria

```gherkin
Feature: Notification centre

  Scenario: Recent notifications (FR-NOTIF-003)
    Given I received 3 reminders this week
    When I open Notifications from the bell on Home
    Then I see them, newest first, unread ones marked with text and not only colour

  Scenario: Mark as read
    When I open the centre
    Then I can mark them all as read, and the bell's count disappears

  Scenario: Only mine (NFR-SEC-001)
    Then I never see another member's notifications

  Scenario: Nothing new (NFR-UX-003)
    Then I see "You're all caught up"
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

- Screen: `docs/design-system/screens/notifications.md` (desktop not designed).
- Data: `notifications`, readable only by its user (`docs/architecture.md` §6.3).
- REST: `GET /notifications`, `POST /notifications/read`.
- Wires the bell on Home left as an empty state by #17 (FR-NAV-002).
MD
printf '\nBlocked by: —\n' >> "$BODY"
NOTIF_CENTRE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTIF-003: in-app notification centre" \
  --label "type:feature,area:planner,priority:must" \
  --body-file "$BODY") && echo "$NOTIF_CENTRE" && NOTIF_CENTRE=${NOTIF_CENTRE##*/}
````

## 5. FR-NOTIF-002: turn on push notifications

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTIF-002, FR-NOTIF-004

### User story

As a member
I want to choose which notifications reach my phone
so that I get reminders without being flooded.

### Acceptance criteria

```gherkin
Feature: Push notifications

  Scenario: Opt in (FR-NOTIF-002)
    Given push is off
    When I turn it on in Settings > Notifications
    Then the browser asks for permission only then, never on page load

  Scenario: Choose the kinds (FR-NOTIF-002)
    Then I can turn reminders and household events on or off separately

  Scenario: Blocked by the browser (FR-NOTIF-002)
    Given I denied permission in the browser
    Then the card says "Notifications are blocked in your browser settings" with a link to help

  Scenario: iPhone and iPad (FR-NOTIF-004)
    Given I use Safari on iOS and HØEM is not on my home screen
    Then the card explains that I must add it to the home screen first, and how

  Scenario: Several devices
    When I turn push on in my phone and my laptop
    Then both receive notifications, and turning it off on one keeps the other
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

- Web Push (RFC 8030) with VAPID keys (RFC 8292, ADR-008); the private key is a secret in
  `src/lib/server-env.ts`, the contact is `mailto:hello@hoemapp.com`.
- Data: `push_subscriptions`, removed when the push service answers 404 or 410.
- REST: `POST/DELETE /push-subscriptions`.
- Fills the "Notifications" section of settings, today "Coming soon" (#21).
MD
printf '\nBlocked by: #%s\n' "$NOTIF_PWA" >> "$BODY"
NOTIF_PUSH=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTIF-002: turn on push notifications and choose their kinds" \
  --label "type:feature,area:planner,area:platform,priority:must" \
  --body-file "$BODY") && echo "$NOTIF_PUSH" && NOTIF_PUSH=${NOTIF_PUSH##*/}
````

## 6. FR-NOTE-004: send reminders to the chosen members

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTE-004, US-NOTE-01

### User story

As a flatmate
I want a monthly reminder to pay the rent, sent to me and to whoever I choose
so that none of us has to remember it.

### Acceptance criteria

```gherkin
Feature: Reminders reach people

  Scenario: The reminder fires (US-NOTE-01)
    Given the note "Pay rent to Ana" with a monthly reminder on day 1 at 09:00
    When that moment arrives
    Then I receive a push notification and it is in my notification centre

  Scenario: Chosen recipients (FR-NOTE-004, US-NOTE-01)
    Given the note is shared and I chose Marcos as a recipient
    When the reminder fires
    Then Marcos receives it too

  Scenario: Only me by default (FR-NOTE-004)
    Given I did not choose anyone
    Then only I receive it

  Scenario: Private notes (FR-NOTE-004)
    Given the note is private
    Then "Notify" lists only me

  Scenario: Next occurrence
    When a repeating reminder fires
    Then its next occurrence is computed and shown on the note
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

- `pg_cron` calls the `dispatch-reminders` Edge Function every minute; it reads due reminders,
  writes the notifications and sends the push messages (`docs/architecture.md` §8.1–8.2). This is
  the first background job: the service-role key lives only there (AGENTS.md, non-negotiables).
- Data: `reminder_recipients`. A recipient must still be a member when it fires.
- Push and the notification centre must exist first; a reminder without push still reaches the
  centre.
MD
printf '\nBlocked by: #%s, #%s, #%s\n' "$NOTE_REMIND" "$NOTIF_CENTRE" "$NOTIF_PUSH" >> "$BODY"
NOTE_SEND=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTE-004: send reminders to the members chosen on the note" \
  --label "type:feature,area:planner,priority:must" \
  --body-file "$BODY") && echo "$NOTE_SEND" && NOTE_SEND=${NOTE_SEND##*/}
````

## 7. FR-NOTE-005: pinned notes and next reminders on Home

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTE-005, FR-NAV-002

### User story

As a member opening HØEM
I want my pinned notes and the next reminders on Home
so that the important things are the first thing I see.

### Acceptance criteria

```gherkin
Feature: Notes on Home

  Scenario: Pinned first (FR-NOTE-005)
    Given 2 pinned notes and a reminder tomorrow
    When I open Home
    Then the Planner card shows the pinned notes, then the next reminders, and "See all"

  Scenario: Quick add
    Then the card has a quick-add field for a new note

  Scenario: No notes (FR-NOTE-005)
    Then the card says "No notes yet. Write one for the household or just for you."
```

### Priority (MoSCoW)

Must

### Area

Planner

### Notes

Screen: `docs/design-system/screens/home.md` (Planner card and its "No notes" state). Private notes
of others never appear.
MD
printf '\nBlocked by: #%s\n' "$NOTE_REMIND" >> "$BODY"
NOTE_HOME=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTE-005: pinned notes and next reminders on Home" \
  --label "type:feature,area:planner,area:dashboard,priority:must" \
  --body-file "$BODY") && echo "$NOTE_HOME" && NOTE_HOME=${NOTE_HOME##*/}
````

## 8. FR-NOTE-006: mark a reminder as done or snooze it

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

FR-NOTE-006, US-NOTE-01

### User story

As a member who got a reminder
I want to mark it as done or snooze it
so that it comes back only when it should.

### Acceptance criteria

```gherkin
Feature: Done and snooze

  Scenario: Done (FR-NOTE-006, US-NOTE-01)
    Given the monthly reminder "Pay rent to Ana" fired today
    When I mark it as done
    Then Home shows the next occurrence, next month

  Scenario: Snooze (FR-NOTE-006)
    When I snooze it for 1 hour, until tonight or until tomorrow
    Then it fires again at that time and the repeating rule is unchanged

  Scenario: From the notification
    Then "Done" and "Snooze 1 hour" are also actions on the push notification where the browser supports them
```

### Priority (MoSCoW)

Should

### Area

Planner

### Notes

REST: `POST …/notes/{noteId}/reminder/done`. "Tonight" means 20:00 in the user's time zone.
MD
printf '\nBlocked by: #%s\n' "$NOTE_SEND" >> "$BODY"
NOTE_SNOOZE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "FR-NOTE-006: mark a reminder as done or snooze it" \
  --label "type:feature,area:planner,priority:should" \
  --body-file "$BODY") && echo "$NOTE_SNOOZE" && NOTE_SNOOZE=${NOTE_SNOOZE##*/}
````

## 9. docs: M5 documentation review

```bash
cat > "$BODY" <<'MD'
### Documents affected

docs/features/planner.md, docs/features/notifications.md, docs/features/settings.md, docs/guides/*.md, docs/architecture.md, docs/adr/README.md, docs/roadmap.md, docs/planning.md

### Description

Close M5 with documentation that matches the code. It adds the first background job and the first
secrets outside Vercel (VAPID, the Edge Function's key), so the deployment guide changes too.

### Done when

- [ ] `docs/features/planner.md` and `docs/features/notifications.md`: what they do, privacy rules,
      requirement IDs and screens
- [ ] `docs/features/settings.md`: the Notifications section is no longer "Coming soon"
- [ ] `docs/guides/deployment.md`: VAPID keys, the Edge Function, `pg_cron` and how to check them
- [ ] `docs/architecture.md` §8 matches the code; new ADRs are in the index
- [ ] `docs/roadmap.md`: M5 marked done, M6 exit criteria reviewed
- [ ] `docs/planning.md` has the M6 issues placed, created from `docs/milestones/m6-dashboard-demo.md`
- [ ] Every link in `docs/` resolves

### Related requirement IDs

FR-NOTE-001, FR-NOTE-002, FR-NOTE-003, FR-NOTE-004, FR-NOTE-005, FR-NOTE-006, FR-NOTIF-001, FR-NOTIF-002, FR-NOTIF-003, FR-NOTIF-004

### Notes

Closes the milestone: the tracking issue #38 can be closed once every item on it is linked to a
closed story.
MD
printf '\nBlocked by: #%s, #%s, #%s, #%s, #%s, #%s, #%s, #%s\n' "$NOTE_NOTES" "$NOTE_REMIND" "$NOTIF_PWA" "$NOTIF_CENTRE" "$NOTIF_PUSH" "$NOTE_SEND" "$NOTE_HOME" "$NOTE_SNOOZE" >> "$BODY"
NOTE_DOCS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "docs: M5 documentation review" \
  --label "type:docs,area:platform,priority:must" \
  --body-file "$BODY") && echo "$NOTE_DOCS" && NOTE_DOCS=${NOTE_DOCS##*/}
```

## Blocks

```bash
add_blocks "$NOTE_NOTES" "#$NOTE_REMIND, #$NOTE_DOCS"
add_blocks "$NOTE_REMIND" "#$NOTE_SEND, #$NOTE_HOME, #$NOTE_DOCS"
add_blocks "$NOTIF_PWA" "#$NOTIF_PUSH, #$NOTE_DOCS"
add_blocks "$NOTIF_CENTRE" "#$NOTE_SEND, #$NOTE_DOCS"
add_blocks "$NOTIF_PUSH" "#$NOTE_SEND, #$NOTE_DOCS"
add_blocks "$NOTE_SEND" "#$NOTE_SNOOZE, #$NOTE_DOCS"
for n in "$NOTE_HOME" "$NOTE_SNOOZE"; do
  add_blocks "$n" "#$NOTE_DOCS"
done
add_blocks "$NOTE_DOCS" "—"
```

## Tracking issue

```bash
gh issue comment 38 --repo "$REPO" --body "Split into: #$NOTE_NOTES, #$NOTE_REMIND, #$NOTIF_PWA, #$NOTIF_CENTRE, #$NOTIF_PUSH, #$NOTE_SEND, #$NOTE_HOME, #$NOTE_SNOOZE and #$NOTE_DOCS."
```

Then ask Claude Code: "add the M5 issues to the planning".
