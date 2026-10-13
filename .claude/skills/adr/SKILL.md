---
name: adr
description: Record an architecture decision as a new ADR in docs/adr using Michael Nygard's format. Use when a significant technical decision is made or an earlier one changes.
argument-hint: [short title]
---

Write an Architecture Decision Record for: $ARGUMENTS

1. ADR-001 to ADR-012 are summarised in `docs/architecture.md` §3. New ones go in `docs/adr/`.
   Take the next free number (ADR-013, ADR-014…).
2. Create `docs/adr/NNNN-kebab-case-title.md` with this structure, under one page:

   ```markdown
   # ADR-NNN Title

   Date: YYYY-MM-DD · Status: Proposed

   ## Context

   The forces at play and the requirement IDs involved.

   ## Decision

   What we will do, in active voice ("We will…").

   ## Consequences

   What becomes easier and harder, and the alternatives we rejected with the reason.
   ```

3. If it replaces an earlier decision, mark the old one "Superseded by ADR-NNN".
4. Add a row to the ADR table in `docs/architecture.md` §3.
5. Leave the status as Proposed. I change it to Accepted after reviewing.
