# ADR-013 Production Supabase project in Ireland

Date: 2026-10-24 · Status: Proposed

## Context

ADR-002 places Supabase in Frankfurt, next to the Vercel functions in `fra1`. The production
project `hoem-production` was created in `eu-west-1` (Ireland) by mistake; `hoem-staging` is in
`eu-central-1` (Frankfurt) as planned. Supabase cannot move a project to another region: the only
fix is to delete it and create a new one. Personal data must stay in the EU (GDPR), and pages must
meet the Core Web Vitals targets of NFR-PERF-001.

## Decision

We will keep `hoem-production` in Ireland. Vercel functions stay in `fra1` for every environment,
and ADR-002 still holds except for the region of the production database.

## Consequences

- Personal data stays in the EU, so the GDPR reasoning of ADR-002 is unchanged.
- Every query from production functions crosses from Frankfurt to Ireland and back, about
  20–30 ms per round trip. A page that waits on several sequential queries pays it several times,
  so server code should batch queries or run them in parallel.
- Previews use the Frankfurt staging project, so latency measured on a preview is lower than in
  production. Lighthouse CI on previews (NFR-PERF-002) can hide a regression that only shows in
  production; Vercel Analytics on real visits is the reference.
- Moving production later means a migration with downtime and real data, much harder than today.
- Rejected: recreating `hoem-production` in Frankfurt (the developer chose not to now).
  Rejected: moving all Vercel functions to `dub1` (Dublin), because previews would then sit far
  from the Frankfurt staging project, and Vercel applies one region setting to every deployment.
