---
name: start-partial
description: Start one pull request of an issue split across several - create its branch from main, open a draft pull request that does not close the issue. Use when the developer asks to start a part of an issue, such as a migration that must merge first.
argument-hint: [issue-number] [part-short-name]
disable-model-invocation: true
allowed-tools: Bash(gh issue view *) Bash(git status *) Bash(git fetch origin) Bash(git switch -c *) Bash(git commit --allow-empty -m *) Bash(git push -u origin *) Bash(gh pr create --draft *) Bash(gh pr list *)
---

## Issue

!`gh issue view $0 --json number,title,state,labels`

## Parts so far

!`gh pr list --state all --search "\"Part of #$0\" in:body" --json number,title,state,headRefName`

## Working tree

!`git status --short --branch`

## Steps

An issue is split when part of it must merge first, usually a migration (ADR-014). The issue was
already started with `/start-issue`, and its plan is approved: this skill plans nothing new. If this
part is not in the approved plan, or there is no plan, stop and ask me what it covers.

1. If the issue is closed, or the arguments do not give an issue and a part name, stop and tell me.
2. Look at the uncommitted changes. They come along when the branch is created, so they must all
   belong to this part. If any does not, or you are not sure, stop and ask me. Never stash, discard
   or revert them.
3. Run `git fetch origin`, then create the branch from the latest `main`:
   `git switch -c <type>/<REQ-ID>-<part-short-name> origin/main`. If git refuses because of the
   uncommitted changes, stop and show me.
4. Open the draft pull request, on an empty commit because GitHub refuses one without commits:
   - `git commit --allow-empty -m "chore(<area>): start <REQ-ID> <part-short-name> (#<issue>)"`
   - `git push -u origin <branch>`
   - `gh pr create --draft --base main --title "<type>(<area>): <part summary> (<REQ-ID>)" --body "Part of #<issue>"`

   The body says `Part of`, never `Closes`, `Fixes` or `Resolves`: GitHub would close the issue when
   this part merges, and `/ship-partial` finds the parts by that line. No AI attribution in the commit
   or the pull request. Never use `--no-verify`.

5. Reply with the pull request link and the other parts of the issue with their state. If there are
   uncommitted changes, list them, and do not commit them: that is for `/ship-partial` or for me.
   Then continue with this part of the plan, or finish it with `/ship-partial` if it is already done.
