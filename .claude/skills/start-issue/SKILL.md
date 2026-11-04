---
name: start-issue
description: Start work on a GitHub issue - read it, create the branch, open a draft pull request and propose a plan before coding. Use when the developer asks to start or pick up an issue.
argument-hint: [issue-number]
disable-model-invocation: true
allowed-tools: Bash(gh issue view *) Bash(git status *) Bash(git switch *) Bash(git pull) Bash(git commit --allow-empty -m *) Bash(git push -u origin *) Bash(gh pr create --draft *) Bash(gh pr view *) Bash(git pull) por Bash(git pull origin main) EnterPlanMode ExitPlanMode
---

## Issue

!`gh issue view $0 --json number,title,body,labels`

## Working tree

!`git status --short --branch`

## Steps

1. If the working tree has uncommitted changes, stop and tell me. Otherwise switch to `main`
   and pull.
2. If the issue body has a `Blocked by:` line, run `gh issue view <n> --json number,title,state`
   for each issue listed. If any is still open, stop and tell me which ones.
3. Create the branch `<type>/<REQ-ID>-<short-name>` from `main` with `git switch -c`
   (type: feat, fix, refactor, test, docs or chore).
4. Open the draft pull request, so CI runs on every push. GitHub refuses a pull request without
   commits, so start the branch with an empty commit (squash-merging drops it):
   - `git commit --allow-empty -m "chore(<area>): start <REQ-ID> (#<issue>)"`
   - `git push -u origin <branch>`
   - `gh pr create --draft --base main --title "<type>(<area>): <issue summary> (<REQ-ID>)" --body "Closes #<issue>"`

   The title follows Conventional Commits with the requirement ID; `/ship` later fills the body
   and marks it ready. No AI attribution in the commit or the pull request. Never use
   `--no-verify`. Give me the pull request link.

5. Enter plan mode with `EnterPlanMode`; the branch and the pull request must exist first, because
   plan mode changes nothing. All the thinking about the issue happens there: find the requirement
   IDs in the issue, read them in `docs/srs.md`, the related sections of `docs/architecture.md`
   and its ADRs, the screen in `docs/design-system/screens/` if it has UI, the guides that apply
   (`docs/guides/migrations.md` for the database, `docs/guides/testing.md` for E2E), and explore
   the code. If I decline plan mode, stop and ask me how to go on.
6. Write the plan to the plan file, ask anything still open with `AskUserQuestion`, and request my
   approval with `ExitPlanMode`. **Write no code until I approve it.** The plan has:
   - files to create or change, grouped by layer (domain, data, service, entry point, UI)
   - the tests you will write first, named with the requirement ID
   - risks, especially for privacy and accessibility
   - the pull requests it needs: a migration merges first, as a part (`/start-partial`, ADR-014)
   - open questions that do not block the plan
