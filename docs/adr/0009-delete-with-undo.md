# ADR-009 Delete with a 5-second undo, no soft delete

Date: 2026-10-14 · Status: Accepted

## Context

NFR-UX-002 requires confirmation or undo for destructive actions. A recycle bin (soft delete) would
add a `deleted_at` filter to every query and every policy.

## Decision

The interface hides the item at once and shows a toast with Undo for 5 seconds; only then does it
call the delete. If the page is closed during those 5 seconds, the pending delete is sent on
`pagehide`. Deleting a whole household or account still asks for typed confirmation.

## Consequences

Simple data model and policies. Once the 5 seconds pass, data is gone for good, which also
simplifies the GDPR right to erasure.
