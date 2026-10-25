# Planner

**Reference:** `planner.html` · **Requirements:** FR-NOTE-001 to 006, FR-NAV-001 · **Issue:** M5 · **Route:** `/planner`

## Layout — mobile (360 px)

1. Avatar button top right.
2. Header: `h1` "Planner", subtitle "Notes and reminders", IconButton (primary style) "New note".
3. Filter (segmented, `aria-label="Filter notes"`): All · Shared · Private.
4. Section "Pinned" (eyebrow): note card "Pay the rent to Ana" — "Monthly · 1 Nov, 09:00" — Badge "Shared".
5. Section "Upcoming reminders": Water the plants (Mon and Thu · 19:00, Shared) · Book the boiler service (Fri 16 Oct · 10:00, Shared) · Dentist appointment (Tue 20 Oct · 17:30, Private).
6. Section "Other notes": Buy a present for Marcos (Private).
   Each row: title, meta with recurrence or date icon, visibility Badge (users icon "Shared" / lock icon "Private"), chevron. Tab bar with Planner current.

## Layout — desktop (1440 px)

Sidebar (Planner current). Header: `h1` "Planner", "Notes and reminders · 5 notes, 4 with reminders", filter (All, Shared, Private, With reminder) and primary "New note". Two columns: **list** (left, the same rows; the selected one highlighted with `brand-tint`) and **editor** (right Card) titled "Edit note" with IconButton "Delete note" and the fields of `note-edit.md`, ending with "Cancel" and "Save".

## Components

SegmentedControl, ListRow / Card, Badge, IconButton, Button, NoteEditor (desktop).

## Texts

`planner.title`, `planner.subtitle` "Notes and reminders", `planner.count` "{notes} notes, {reminders} with reminders", `planner.new` "New note", filters, `planner.pinned` "Pinned", `planner.upcoming` "Upcoming reminders", `planner.other` "Other notes", `badge.shared` "Shared", `badge.private` "Private".

## States

- **Empty**: EmptyState "No notes yet" + "Write one for the household or just for you." + primary "New note".
- **Filter with no results**: "No private notes."
- **Loading**: skeleton rows.
- **Deleted**: row disappears with a 5-second undo toast (ADR-009).

## Accessibility

Sections are `h2`. Each row is one link; the visibility badge text is part of its accessible name.
