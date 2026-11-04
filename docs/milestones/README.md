# Milestone issue scripts

One file per milestone with every issue to create when that milestone starts (rolling-wave
planning: a milestone is split into issues when the previous one is close to done). Each issue is a
block of shell commands to copy into a terminal, with its title, labels, milestone and full body,
written in the format of the issue forms in `.github/ISSUE_TEMPLATE/`.

| File                                                         | Milestone                  | Tracking issue | Create when          |
| ------------------------------------------------------------ | -------------------------- | -------------- | -------------------- |
| [`m1-follow-ups.md`](m1-follow-ups.md)                       | M0, M1a, M1b (loose ends)  | —              | Now                  |
| [`m2-shopping.md`](m2-shopping.md)                           | M2 Shopping                | #35            | M1b is close to done |
| [`m3-meals-recipes.md`](m3-meals-recipes.md)                 | M3 Meals & recipes         | #36            | M2 is close to done  |
| [`m4-expenses-budgets.md`](m4-expenses-budgets.md)           | M4 Expenses & budgets      | #37            | M3 is close to done  |
| [`m5-planner-notifications.md`](m5-planner-notifications.md) | M5 Planner & notifications | #38            | M4 is close to done  |
| [`m6-dashboard-demo.md`](m6-dashboard-demo.md)               | M6 Dashboard & demo        | #39            | M5 is close to done  |
| [`m7-release.md`](m7-release.md)                             | M7 MVP release v1.0.0      | #40            | M6 is close to done  |

## Before you start

- Install the GitHub CLI and sign in once with `gh auth login`.
- Run the blocks **in order, in the same terminal window**. Each block saves the number of the
  issue it creates in a shell variable (`$SHOP_LIST`, `$SHOP_LIVE`…) and later blocks use it for
  their `Blocked by:` line. If you close the terminal halfway, set the variables again by hand
  (`SHOP_LIST=123`) before going on.
- Every file starts with a **setup** block: run it first.
- Read each issue before creating it: the milestone may have changed since this file was written.
  Edit the body in the block if needed, then paste it.

## What each file does

1. **Setup:** a temporary file for the bodies and a helper that adds `Blocks:` lines at the end.
2. **One block per issue:** writes the body to the temporary file, adds the `Blocked by:` line
   (`—` when nothing blocks it), creates the issue and prints its URL.
3. **Blocks:** adds the `Blocks:` line to every issue, now that all their numbers exist.
   `/start-issue` reads `Blocked by:`; the planning rules use `Blocks:` to put first the issues
   that unblock more.
4. **Tracking issue:** comments the list of new issues on the milestone's tracking issue.
5. **Planning:** ask Claude Code to place the new issues in `docs/planning.md`
   ("add the M2 issues to the planning").

## Conventions used in the issues

- **Titles:** stories start with their main requirement ID (`FR-SHOP-001: …`), tasks with their
  type (`chore: …`, `ci: …`), documentation with `docs: …`.
- **Labels:** one `type:` (feature, chore, docs), one or more `area:` and one `priority:` (must,
  should, could), as the issue forms set them.
- **Acceptance criteria** are Gherkin scenarios (Given / When / Then), one per behaviour, with
  the requirement ID in the scenario name when it proves one.
- **A migration** that a story needs merges first, in its own pull request
  (`docs/guides/migrations.md`): it is a part of the same issue (`/start-partial`), not a separate
  issue.
- Every milestone ends with its `docs: <milestone> documentation review` issue, blocked by all the
  others (`AGENTS.md`, Planning).
