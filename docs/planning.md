# Planning

The queue of open issues, in the order they should be done. GitHub holds the issues themselves;
this file holds only their order and the reason for it.

## How the queue is ordered

1. Milestone order: M1a → M1b → M2 → … → M7.
2. Within a milestone, `priority:must` before `should` before `could`.
3. An issue goes after everything it is blocked by.
4. Between issues that are otherwise equal, the one that unblocks more issues goes first.
5. Chores that protect CI or the workflow go first if they slow down every issue (for example a
   flaky or slow pipeline); otherwise they go at the end of their milestone.

When an issue is added, place it by these rules and write why in the last column. When an issue
is shipped, remove its row. The milestone tracking chores (#35–#40) are split into issues before
their milestone starts.

## Queue

| #   | Issue                                                    | Milestone | Priority | Blocked by | Why here                                    |
| --- | -------------------------------------------------------- | --------- | -------- | ---------- | ------------------------------------------- |
| 19  | FR-ACC-009: create a household with a type and change it | M1a       | must     | —          | Unblocks #20, #26, #31, #32                 |
| 21  | FR-NAV-003: profile and settings menu with sign-out      | M1a       | must     | —          | Unblocks #22, #23, #26                      |
| 20  | FR-ACC-004: switch the active household from the header  | M1a       | must     | #19        | Needs households to create first            |
| 22  | FR-ACC-007: edit my profile, avatar, theme and language  | M1a       | must     | #21        | Entry point is the profile menu             |
| 23  | FR-ACC-007: delete my account                            | M1a       | must     | #21        | Entry point is the profile menu             |
| 25  | FR-ACC-002: sign in with Google                          | M1a       | should   | —          | Should; independent                         |
| 55  | ci: cache Playwright system libraries, time out installs | M1a       | should   | —          | Move up if CI installs keep stalling        |
| 50  | chore: run end-to-end tests in Firefox and Edge          | M1a       | should   | —          | Widens browser coverage; no feature depends |
| 26  | FR-ACC-006: see household members and manage roles       | M1b       | must     | #19, #21   | Unblocks #27, #30                           |
| 32  | FR-ONB-001: guided household setup, step 1 and progress  | M1b       | must     | #19        | Starts the setup chain #33 → #34            |
| 27  | FR-ACC-005: invite people to a household by e-mail       | M1b       | must     | #26        | Unblocks #28, #34                           |
| 30  | FR-HH-009: parents decide who can split expenses         | M1b       | must     | #26        | Needs member roles                          |
| 33  | FR-ONB-003: setup steps for meals and money              | M1b       | must     | #32        | Next step of the setup chain                |
| 28  | FR-ACC-005: accept an invitation, or see that it expired | M1b       | must     | #27        | Unblocks #29                                |
| 29  | NFR-LEG-001: children under 14 join only through family  | M1b       | must     | #28        | Builds on accepting invitations             |
| 34  | FR-ONB-005: setup step for people, skipping steps        | M1b       | must     | #33, #27   | Closes the setup chain                      |
| 31  | FR-HH-010: configure the rules of an "other" household   | M1b       | should   | #19        | Should                                      |
| 35  | chore: plan and track M2 Shopping                        | M2        | must     | —          | Split into issues when M1b ends             |
| 36  | chore: plan and track M3 Meals & recipes                 | M3        | must     | —          | Milestone order                             |
| 37  | chore: plan and track M4 Expenses & budgets              | M4        | must     | —          | Milestone order                             |
| 38  | chore: plan and track M5 Planner & notifications         | M5        | must     | —          | Milestone order                             |
| 39  | chore: plan and track M6 Dashboard & demo                | M6        | must     | —          | Milestone order                             |
| 54  | chore: get Auth e-mails into the Outlook inbox           | M7        | must     | —          | Needed for release, not for development     |
| 40  | chore: plan and track M7 MVP release v1.0.0              | M7        | must     | —          | Milestone order                             |
