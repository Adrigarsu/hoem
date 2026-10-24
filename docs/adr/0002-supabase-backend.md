# ADR-002 Supabase as the backend platform

Date: 2026-10-14 · Status: Accepted · Amended by ADR-013 (production region)

## Context

The MVP needs PostgreSQL, authentication (email, Google, anonymous), real-time updates for the
shopping list, file storage for photos and a scheduler for reminders, within free tiers.

## Decision

Supabase, in the EU region (Frankfurt), for Postgres, Auth, Realtime, Storage, Edge Functions and
pg\_cron. The web app is hosted on Vercel, in the same region.

## Consequences

One managed platform covers every infrastructure need, and EU hosting keeps personal data in the EU
(GDPR). Supabase is open source and can be self-hosted, which limits lock-in. Rejected: assembling
Auth.js, Neon, Pusher and S3 separately (more integrations, more secrets, more failure points).
