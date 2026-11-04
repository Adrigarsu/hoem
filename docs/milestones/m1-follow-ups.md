# M0 and M1 follow-ups

Loose ends found in the repository organisation review (November 2026). Run them now; they do not
create new issues.

## 1. Close the M0 milestone

M0 Walking skeleton has no open issues and Gate A is passed (`docs/roadmap.md`).

```bash
gh api -X PATCH repos/Adrigarsu/hoem/milestones/1 -f state=closed --jq '.title + ": " + .state'
```

## 2. Update the M1 documentation review (#71)

#71 was written before `docs/guides/` existed. It asks for `development.md` and `operations.md`,
which became the guides in `docs/guides/README.md`, and its feature list misses `auth`, `home` and
`shell`. A comment records the change without rewriting the issue:

```bash
BODY=$(mktemp)
cat > "$BODY" <<'MD'
Update after the repository organisation review (branch `docs/NFR-MNT-005-repo-organization`):

- `docs/guides/development.md` and `docs/guides/operations.md` became separate guides, already
  written: `local-setup.md`, `workflow.md`, `migrations.md`, `testing.md`, `screenshots.md`,
  `deployment.md` and `dependencies.md` (index in `docs/guides/README.md`). Here they are only
  reviewed against the code at the end of M1.
- Feature pages still missing: `docs/features/auth.md`, `docs/features/home.md` and
  `docs/features/shell.md`.
- The ADR index now lives only in `docs/adr/README.md`; `docs/architecture.md` links to it.
- `docs/roadmap.md` and `docs/milestones/` are new: check that the M2 file still matches the SRS
  before creating its issues.
MD
gh issue comment 71 --repo Adrigarsu/hoem --body-file "$BODY"
```
