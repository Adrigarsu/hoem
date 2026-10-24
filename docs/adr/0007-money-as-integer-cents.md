# ADR-007 Money as integer cents

Date: 2026-10-14 · Status: Accepted

## Context

Floating-point numbers cannot represent most decimal amounts exactly (0.1 + 0.2 ≠ 0.3), which breaks
splits and balances.

## Decision

Amounts are `bigint` cents in the database and `number` cents in TypeScript; formatting to "€43.20"
happens only in the interface with `Intl.NumberFormat`. One currency per household (ISO 4217 code).
Splits that do not divide evenly give the leftover cent to the payer.

## Consequences

Totals and balances are exact. Multi-currency households are out of scope.
