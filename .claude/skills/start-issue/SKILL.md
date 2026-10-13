---
name: start-issue
description: Start work on a GitHub issue - read it, create the branch and propose a plan before coding. Use when the developer asks to start or pick up an issue.
argument-hint: [issue-number]
disable-model-invocation: true
allowed-tools: Bash(gh issue view *) Bash(git status *) Bash(git switch *) Bash(git pull)
---

## Issue

!`gh issue view $0 --json number,title,body,labels`

## Working tree

!`git status --short --branch`

## Steps

1. If the working tree has uncommitted changes, stop and tell me. Otherwise switch to `main`
   and pull.
2. Find the requirement IDs in the issue. Read them in `docs/srs.md` and the related sections
   of `docs/architecture.md`.
3. Create the branch `<type>/<REQ-ID>-<short-name>` from `main`
   (type: feat, fix, refactor, test, docs or chore).
4. Propose a plan and **wait for my approval before writing code**:
   - files to create or change, grouped by layer (domain, data, service, entry point, UI)
   - the tests you will write first, named with the requirement ID
   - risks, especially for privacy and accessibility
   - open questions
