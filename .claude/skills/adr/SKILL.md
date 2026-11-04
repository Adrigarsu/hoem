---
name: adr
description: Record an architecture decision as a new ADR in docs/adr using Michael Nygard's format. Use when a significant technical decision is made or an earlier one changes.
argument-hint: [short title]
---

Write an Architecture Decision Record for: $ARGUMENTS

1. Read the rules in `docs/adr/README.md`. Take the next free number (never reuse one).
2. Copy `docs/adr/template.md` to `docs/adr/NNNN-kebab-case-title.md` and fill it in, under one page.
3. If it changes an earlier decision, say how on both status lines: `Supersedes ADR-NNN` /
   `Superseded by ADR-NNN` when it replaces it entirely, `Amends ADR-NNN` / `Amended by ADR-NNN (what)`
   when it changes one part. Update the old one's row in the index too.
4. Add a row to the matching topic in `docs/adr/README.md`. That file is the only index: do not
   copy the list anywhere else.
5. Leave the status as Proposed. I change it to Accepted when its pull request merges.
