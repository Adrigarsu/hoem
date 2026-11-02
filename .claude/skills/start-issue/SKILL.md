---
name: start-issue
description: Start work on a GitHub issue - read it, create the branch, open a draft pull request and propose a plan before coding. Use when the developer asks to start or pick up an issue.
argument-hint: [issue-number]
disable-model-invocation: true
allowed-tools: Bash(gh issue view *) Bash(git status *) Bash(git switch *) Bash(git pull) Bash(git commit --allow-empty -m *) Bash(git push -u origin *) Bash(gh pr create --draft *) Bash(gh pr view *)
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
3. Find the requirement IDs in the issue. Read them in `docs/srs.md` and the related sections
   of `docs/architecture.md`.
4. Create the branch `<type>/<REQ-ID>-<short-name>` from `main` with `git switch -c`
   (type: feat, fix, refactor, test, docs or chore).
5. Open the draft pull request, so CI runs on every push. GitHub refuses a pull request without
   commits, so start the branch with an empty commit (squash-merging drops it):
   - `git commit --allow-empty -m "chore(<area>): start <REQ-ID> (#<issue>)"`
   - `git push -u origin <branch>`
   - `gh pr create --draft --base main --title "<type>(<area>): <issue summary> (<REQ-ID>)" --body "Closes #<issue>"`

   The title follows Conventional Commits with the requirement ID; `/ship` later fills the body
   and marks it ready. No AI attribution in the commit or the pull request. Never use
   `--no-verify`. Give me the pull request link.

6. Propose a plan and **wait for my approval before writing code**:
   - files to create or change, grouped by layer (domain, data, service, entry point, UI)
   - the tests you will write first, named with the requirement ID
   - risks, especially for privacy and accessibility
   - open questions
