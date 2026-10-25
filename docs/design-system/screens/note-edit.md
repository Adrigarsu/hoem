# New or edit note

**Reference:** `note-edit.html` · **Requirements:** FR-NOTE-001 to 004, FR-NOTIF-002 · **Issue:** M5 · **Route:** `/planner/new`, `/planner/[id]`

## Layout — mobile (360 px)

Full-screen form (no tab bar).

1. Top bar: IconButton "Close without saving" (x), title `h1` "New note" (or "Edit note"), primary small button "Save".
2. Field "Note" (textarea) with counter "19 / 500".
3. Fieldset "Who can see it?": segmented choice **Shared** (users icon) / **Only me** (lock icon).
4. Switch row "Pin to Home".
5. Switch row "Remind me"; when on, it reveals:
   - "Starts" (date) and "Time" (time) side by side.
   - Select "Repeat": Every month, Never, Every day, Every week, Every year.
   - Summary text: "On day 1 of every month at 09:00."
   - Fieldset "Notify": checkboxes with avatars — You, Marcos (only members who can see the note).

## Layout — desktop

The same fields in the right-hand editor of the Planner page, with "Cancel" and "Save" at the bottom and a "Delete note" IconButton in the header.

## Components

Textarea with counter, SegmentedControl, Switch row, Date and time inputs, Select, Checkbox with Avatar, Button, IconButton.

## Texts

`note.new` "New note", `note.edit` "Edit note", `note.save` "Save", `note.close` "Close without saving", `note.body` "Note", `note.counter` "{count} / 500", `note.visibility` "Who can see it?", `note.shared` "Shared", `note.onlyMe` "Only me", `note.pin` "Pin to Home", `note.remind` "Remind me", `note.starts` "Starts", `note.time` "Time", `note.repeat` "Repeat", repeat options, `note.summary` (built from the rule, e.g. "On day 1 of every month at 09:00."), `note.notify` "Notify".

## States

- **Private note**: "Notify" lists only you.
- **Validation**: body required, max 500 characters (counter turns `danger` over the limit); reminder start must be in the future.
- **Unsaved changes + close**: confirm dialog "Discard this note?".
- **Saving / error**: button spinner; error Alert at the top with retry.

## Accessibility

The counter is linked with `aria-describedby` and announced politely only near the limit. The summary sentence is a live region when the rule changes.
