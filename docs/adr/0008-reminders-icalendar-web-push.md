# ADR-008 Reminders with iCalendar rules and Web Push

Date: 2026-10-14 · Status: Accepted

## Context

Notes can repeat (daily, chosen weekdays, monthly, yearly) and must notify chosen members even when
the app is closed (FR-NOTE-003, FR-NOTIF-002).

## Decision

A reminder stores its start, time zone and an RFC 5545 recurrence rule
(`FREQ=MONTHLY;BYMONTHDAY=1`), plus a precomputed `next_fire_at`. pg\_cron calls an Edge Function
every minute; it sends due reminders with the Web Push protocol (RFC 8030, VAPID keys per RFC 8292),
writes them to the in-app notification centre, and computes the next occurrence with the `rrule`
library.

## Consequences

A standard format any calendar understands; times stay correct across daylight-saving changes
because rules are evaluated in the user's time zone. Delivery is at most about one minute late. On
iOS, push requires the app to be installed to the home screen (FR-NOTIF-004).
