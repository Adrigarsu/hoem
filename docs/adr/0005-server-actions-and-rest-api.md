# ADR-005 Server Actions and a REST API with OpenAPI

Date: 2026-10-14 · Status: Accepted

## Context

The web app benefits from Server Actions (no hand-written fetch code, progressive enhancement). A
future native app, the AI assistant and external integrations need a stable, documented HTTP API.

## Decision

Both entry points call the same application services. Server Actions serve the web UI. A REST API
under `/api/v1` exposes the same use cases, is described with OpenAPI 3.1 generated from the shared
Zod schemas, and is browsable at `/api/docs`.

## Consequences

Business rules live once, in the services; the two entry points stay thin. Versioning in the path
lets the API evolve without breaking clients. Rejected: Server Actions only (no public API) and tRPC
(TypeScript clients only).
