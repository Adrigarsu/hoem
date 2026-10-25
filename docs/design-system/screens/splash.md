# Launch screen

**Reference:** `splash.html` · **Requirements:** FR-NAV-004 · **Issue:** M1-05 · **Route:** none, shown by `src/app/(app)/loading.tsx` while the session is checked

## Purpose

Shows the HØEM logo instead of a blank page while the app checks the session. It disappears as soon as the check finishes, with no minimum display time.

## Layout (all widths)

Full viewport, background `brand`, content centred vertically and horizontally, gap `space-6`.

1. Logo "HØEM": Montserrat 800, 56 px, letter-spacing 2 px, colour `on-brand`; the "Ø" uses `brand-tint`. `role="img"`, `aria-label="HØEM"`.
2. Status block (`role="status"`), gap `space-3`:
   - Progress track 120 × 4 px, `radius-full`, `on-brand` at 25 % opacity; indicator `on-brand`, 45 % width (indeterminate animation).
   - Text "Opening your home…" — 14/20, `brand-tint`.

## Components

Logo, ProgressBar (indeterminate). No navigation.

## Texts

- `splash.loading`: "Opening your home…"

## States

- **Loading**: the only state.
- **Reduced motion**: the indicator does not move; it stays at 45 %.

## Mobile vs desktop

Identical; the content stays centred at any width.

## Accessibility

`main` has `aria-busy="true"`. The status text is announced once by screen readers.
