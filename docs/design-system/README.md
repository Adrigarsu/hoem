# HØEM Design System

HØEM helps households organise meals, shopping and money together. The interface should feel calm, warm and trustworthy: a tidy home, not a control panel. This system defines the tokens and components every screen is built from; nothing in the product uses a hard-coded colour, size or spacing value (NFR-UX-004).

## Principles

1. **Calm first.** Warm neutral background, generous space, one strong colour per view. Colour is used to orient, not to decorate.
2. **Accessible by construction.** Every colour pair in this system meets WCAG 2.2 AA in light and dark themes. If a combination is not listed under "Colour roles", it has not been checked: do not use it.
3. **Borders, not shadows.** Layers are separated by 1px hairlines (`border`) and a step in surface colour. The only "glow" in the product is the focus ring.
4. **One family, many weights.** Plus Jakarta Sans for everything; hierarchy comes from size and weight, never from a second typeface.
5. **Modules are recognisable at a glance.** Each module has its own accent, always shown together with its icon and name.

## Logo

The wordmark is **HØEM** set in a heavy geometric sans (Montserrat ExtraBold is the working match) with the **Ø in `brand` blue** and the other letters in `text`. On a `brand` background the letters are white and the Ø uses `brand-tint`.

- The Ø is the brand's signature: never recolour it to a module colour.
- Minimum height 20px on screen; clear space around it equal to the height of the Ø.
- Files in `assets/logos/` (SVG, colours from the `brand` and `brand-tint` tokens, each with `role="img"` and the title "HØEM"):
  - `hoem-o.svg`: the Ø in `brand`, for light backgrounds.
  - `hoem-o-inverse.svg`: the Ø in `brand-tint`, for `brand` backgrounds (5.3:1).
  - `hoem-app-icon.svg`: 1024 × 1024 `brand` square with the Ø in `brand-tint`, the source for the favicon and the PWA icons.
- A vector master of the full HØEM wordmark is still pending.

## Colour

All colours are defined in OKLCH. Module and status accents share the same lightness (L ≈ 0.52) and chroma (C 0.14) and only rotate the hue, which is why they read as one family and have near-identical contrast. Shopping uses L 0.50 because its hue is optically lighter.

| Hue | Role                      | Token                                                               |
| --- | ------------------------- | ------------------------------------------------------------------- |
| 265 | Brand, Home, links, focus | `brand` (#1F4BFF, slightly more saturated than the rest on purpose) |
| 55  | Meals                     | `meals`                                                             |
| 190 | Shopping                  | `shopping`                                                          |
| 320 | Expenses                  | `expenses`                                                          |
| 145 | Success                   | `success`                                                           |
| 85  | Warning, pending          | `warning`                                                           |
| 25  | Danger, errors            | `danger`                                                            |

### Colour roles: the only approved pairs

Every accent has three steps. Use them only like this:

| Step               | Use on                                                      | Text on it                  | Contrast |
| ------------------ | ----------------------------------------------------------- | --------------------------- | -------- |
| `{accent}` (solid) | Icons and coloured text on `bg` or `surface`; solid buttons | `on-accent` (or `on-brand`) | ≥ 4.7:1  |
| `{accent}-tint`    | Badges, selected cards, icon tiles                          | `{accent}-ink`              | ≥ 8:1    |
| `{accent}-ink`     | Only on its own tint                                        | —                           | —        |

Neutrals: `text` (16:1) for content, `text-secondary` (6.9:1) for metadata, `text-muted` (5.1:1) for placeholders and checked items. `border-control` (3.4:1) outlines every input and checkbox; `border` (1.25:1) is decorative and never the only edge of a control.

Status colours never appear alone: a "Pending" badge always carries its icon and word. The dark theme uses warm dark greys rather than black (`bg` L 0.235, `surface` L 0.275, `surface-subtle` L 0.315), which keeps depth visible between layers and reduces glare. Accents become lighter (L ≈ 0.78) and solid fills take dark text (`on-accent` flips to near-black).

## Typography

Plus Jakarta Sans (weights 400, 500, 600, 700), self-hosted with `next/font` so visitors never contact Google (GDPR); the `@import` in `components-reference.css` is only for the reference previews. Amounts, times and quantities use `font-variant-numeric: tabular-nums` (the `tabular-nums` utility) so columns align. No monospace face is needed.

The scale follows a 1.25 ratio rounded to the 4px grid: 12 · 14 · 16 · 20 · 24 · 32 · 40. Body text is never below 16px; 12px (`caption`, `eyebrow`) is the floor for anything on screen. Sentence case everywhere except `eyebrow` labels, which are uppercase with 0.08em tracking.

## Space and density

An 8-point grid with 4px half-steps: every margin, padding and gap is a `space-*` token (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). HØEM is **airy**: cards pad `space-6` (24px), cards sit `space-8` apart, page sections `space-10`. Controls are `control-height` (44px), which is also the touch target.

## Shape

Intermediate corners: `radius-md` (10px) for controls, `radius-lg` (14px) for cards, `radius-xl` (20px) for modals and sheets, `radius-full` for badges and avatars. A nested element always uses a smaller radius than its container.

## Iconography

[Lucide](https://lucide.dev) outline icons at 1.5px stroke, `icon-md` (20px) by default, `icon-sm` in badges, `icon-lg` in navigation. Icons inherit `currentColor`. An icon-only button always has an `aria-label` and a tooltip (NFR-A11Y-004).

| Module                        | Icon            |
| ----------------------------- | --------------- |
| Home                          | `house`         |
| Meals                         | `utensils`      |
| Shopping                      | `shopping-cart` |
| Expenses                      | `wallet`        |
| Planner (notes and reminders) | `calendar`      |
| Private item                  | `lock`          |
| Shared item                   | `users`         |

## Motion

Short and functional: `duration-fast` (150ms) for hovers and toggles, `duration-base` (200ms) for menus, `duration-slow` (300ms) for sheets and modals, easing `ease-standard` (`cubic-bezier(0.2, 0, 0, 1)`). Everything collapses to an instant change under `prefers-reduced-motion: reduce` (NFR-A11Y-006).

## Layout

Mobile first. Below `bp-md` (768px): bottom tab bar with Shopping, Expenses, Home (centre), Planner and Meals, plus the avatar button at the top right for profile and settings. From `bp-md`: fixed sidebar of `sidebar-width`. From `bp-lg`: two-column dashboard. Content max-width 1200px from `bp-xl`.

## Voice

Friendly, short, active: "Add to shopping list", "Saved", "Your private expenses". No exclamation marks, no "please", no "successfully". Errors say what happened and what to do: "That email is already in this household. Try another."

## In the app

`src/design-system/tokens.css` turns these tokens into CSS variables and Tailwind utilities, and a unit test fails when it drifts from `tokens.json`. Tailwind's own palette, spacing scale and shadows are removed, so only token utilities exist: `bg-surface`, `text-text-secondary`, `border-border-control`, `p-6` (24px), `rounded-lg`, `text-body`, `duration-fast`. Another test checks every pair in "Colour roles" against WCAG 2.2 in both themes, and the linters reject hard-coded colours and arbitrary values such as `bg-[#fff]`.

## Accessibility audit

Every component is checked in two ways before it enters the system:

1. **Automated rules:** each preview runs through axe-core 4 (Deque), the engine behind Lighthouse and most accessibility CI tools. Last run: 21 previews, 0 violations.
2. **Contrast matrix:** every foreground/background pair the stylesheet actually uses (text, icons, control edges, focus ring, switch thumbs, check marks, toast text) is computed with the WCAG 2.2 formula in both themes. Last run: 120 pairs in light and 51 key pairs in the revised dark theme, 0 failures; the lowest text pair is 4.55:1 (light) and 5.61:1 (dark).

What automation cannot prove is reviewed by hand per component and written in its guidelines: focus order, focus trapping in Modal and BottomSheet, Escape to close, live-region announcements in Toast, keyboard alternatives to drag and drop in MealSlot. In the product, the same axe checks run in CI with Playwright on real pages (NFR-A11Y-001).

## Accessibility checklist

- Text ≥ 4.5:1, large text, icons and control edges ≥ 3:1, in both themes.
- Visible `focus-ring` on every interactive element.
- Colour never carries meaning alone.
- Targets ≥ 44 × 44px.
- Works from 360px wide without horizontal scrolling.
