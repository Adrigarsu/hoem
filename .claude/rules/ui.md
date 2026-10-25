---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# UI components

- Start from the screen in `docs/design-system/screens/<screen>.md` and `.html`, and the decisions in
  its `README.md`. Match its layout, texts and states; if the page has no screen, or the screen
  disagrees with the SRS or an accessibility rule, ask before building.
- Build from the design system in `src/design-system/` before writing new markup.
  If a component is missing, propose adding it there rather than styling one-off markup.
- Colours, type, radii and spacing come from design tokens (CSS variables, 8-point grid).
  Each module has its own accent: meals, shopping, expenses; the brand blue is for primary actions.
- Every interactive element is reachable and usable with the keyboard, has a visible focus ring
  and an accessible name. Icon-only buttons get an `aria-label` from the messages file.
- Touch targets are at least 44×44 px. Colour is never the only way information is shown.
- Check contrast in **both** themes: text ≥ 4.5:1, large text and UI parts ≥ 3:1.
- Respect `prefers-reduced-motion` for any animation.
- Server Components by default; add `"use client"` only for state, effects or browser APIs.
- Forms validate with the feature's Zod schema on both client and server, and show errors
  next to the field, linked with `aria-describedby`.
