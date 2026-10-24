# ADR-001 One Next.js application in one repository

Date: 2026-10-14 · Status: Accepted

## Context

One part-time developer builds a web app with a design system, a REST API and background jobs.
Splitting these into separate packages (a Turborepo monorepo) adds build configuration, versioning
and tooling before any feature exists.

## Decision

A single Next.js project in one GitHub repository, organised as a modular monolith: code grouped by
feature, layers inside each feature, and lint rules that forbid imports across feature boundaries
except through each feature's public `index.ts`.

## Consequences

One build, one deploy, one test run. The design system lives in `src/design-system/` and could be
extracted into a package later because nothing outside it reaches into its internals. Rejected: a
monorepo (too much setup for the MVP) and a separate backend service (two deploys, duplicated
types).
