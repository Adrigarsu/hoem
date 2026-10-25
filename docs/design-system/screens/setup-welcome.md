# Setup guide: welcome

**Reference:** `setup-welcome.html` · **Requirements:** FR-ONB-001, FR-ONB-006, US-ONB-01 · **Issue:** M1-19 · **Route:** `/setup`

## Purpose

First screen after creating a household (or after confirming the e-mail). Explains the four steps and lets the user start or skip.

## Layout — mobile (360 px)

Column, padding `space-16` top, `space-6` sides, `space-8` bottom; gap `space-6`.

1. Logo "HØEM" (Montserrat 800).
2. `h1` "Welcome, Lucía" + paragraph "Let's set up your household so HØEM works the way your home does. It takes about two minutes, and you can change everything later." (`text-secondary`).
3. Ordered list of the four steps; each row: number badge (`brand-tint` / `brand-ink`, 32 px circle), title (16/24, 600) and description (14/20, `text-secondary`):
   1. Your household — Name and who lives there
   2. Meals — Which meals you plan
   3. Money — Budget and how costs are shared
   4. People — Invite the people you live with
4. Actions at the bottom: primary "Set it up with me", secondary "Skip for now" (full width, stacked).
5. Note: "You can open this guide again from Settings." (14/20, `text-secondary`, centred).

## Layout — desktop

Same content in a centred column, max width 480 px, with the page background `bg`. No sidebar during the setup guide.

## Components

Logo, StepList, Button (primary, secondary).

## Texts

`setup.welcome.title` "Welcome, {name}" · `setup.welcome.lede` (see above) · step titles and descriptions as listed · `setup.welcome.start` "Set it up with me" · `setup.welcome.skip` "Skip for now" · `setup.welcome.reopen` "You can open this guide again from Settings."

## States

- **Skip**: goes to Home; the household keeps the defaults of its type (FR-HH-001).
- **Reopened from Settings**: same screen; the title becomes "Set up {household}".

## Accessibility

The steps are an `<ol>`; the number badges are decorative because the list already numbers them.
