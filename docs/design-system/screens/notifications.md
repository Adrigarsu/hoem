# Notifications

**Reference:** `notifications.html` · **Requirements:** FR-NOTIF-001 to 004, FR-NAV-002 · **Issue:** M5 · **Route:** `/notifications`

## Layout — mobile (360 px)

1. Top bar: back link "Home" (chevron) and ghost button "Mark all as read" on the right.
2. `h1` "Notifications".
3. **Push opt-in card** (shown until push is enabled; `brand-tint` card): title "Get reminders on this phone", text "Turn on notifications so your reminders arrive even when HØEM is closed. On iPhone, add HØEM to your Home Screen first.", primary button "Turn on", ghost link "How to add to Home Screen".
4. Group "Today" (eyebrow): notification rows. Unread rows have a `brand` dot and the hidden prefix "Unread:". Each row: module icon tile, title (16/24, 600), meta "Reminder · 19:00" / "Shopping · 10 min ago". Reminder rows add two small buttons: "Done" and "Snooze".
   - Water the plants — Reminder · 19:00 (Done, Snooze)
   - Marcos added milk to the shopping list — Shopping · 10 min ago
5. Group "Earlier": "You've used 69% of the shared budget" — Expenses · Mon; "Marcos joined Calle Mayor flat" — Household · 28 Sep.

No tab bar on this screen (it is a sub-page of Home).

## Layout — desktop

Not designed. Use a popover panel (400 px wide) under the bell in the header with the same content, and keep `/notifications` as a full page in the content column.

## Components

Card (tinted), Button (primary, ghost, small secondary), ListRow, IconTile, Eyebrow.

## Texts

`notifications.title`, `notifications.markAll`, `notifications.push.title|text|turnOn|howTo`, `notifications.today`, `notifications.earlier`, `notifications.unread` "Unread:", `notifications.done` "Done", `notifications.snooze` "Snooze", plus one template per notification kind.

## States

- **Empty**: EmptyState with bell icon, "You're all caught up".
- **Push denied by the browser**: the card changes to "Notifications are blocked in your browser settings." with a link to help.
- **iPhone not installed**: the card explains the Home Screen step first (FR-NOTIF-004).
- **Loading**: three skeleton rows.

## Accessibility

Never mention another member's private records in a notification. Unread state is in text, not only the dot.
