# ADR-006 Visibility decided at write time

Date: 2026-10-14 · Status: Accepted

## Context

Who can see a private expense depends on the household type and the author's family role
(FR-HH-002). FR-HH-007 requires that changing the household type never exposes existing private
data.

## Decision

Each private expense stores `visible_to_parents`, set by a database trigger when the row is
inserted, from the household rules in force at that moment. Policies read that column, never the
current household type.

## Consequences

Past records keep the visibility they were created with, which satisfies FR-HH-007 by construction.
Changing the rules affects only new records, as the setup screen warns.
