---
name: ship
description: Finish the current task - verify it, commit and open a pull request. Use when the developer says the work is ready to ship.
disable-model-invocation: true
allowed-tools: Bash(pnpm check) Bash(git status *) Bash(git diff *) Bash(git log *)
---

## Branch

!`git status --short --branch`

## Commits not yet in main

!`git log --oneline main..HEAD`

## Steps

1. If the current branch is `main`, stop: work must happen on a branch.
2. Run `pnpm check`. If it fails, fix the cause and run it again. Do not continue until it passes.
3. Go through the Definition of done in `AGENTS.md` and list anything that is not met.
   If something important is missing, stop and ask.
4. Commit any remaining changes with Conventional Commits that include the requirement ID.
   Never use `--no-verify`.
5. Push the branch and open a pull request with `gh pr create`. Follow
   `.github/pull_request_template.md` if it exists; otherwise include: summary, requirement IDs,
   `Closes #<issue>`, how it was tested, screenshots needed for UI changes, and what is out of scope.
6. Reply with the PR link and remind me to read the diff before squash-merging.
   **Never merge the pull request yourself.**
