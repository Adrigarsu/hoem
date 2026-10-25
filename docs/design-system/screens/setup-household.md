# Setup guide: step 1, your household

**Reference:** `setup-household.html` · **Requirements:** FR-ONB-002, FR-HH-001, FR-HH-007, FR-ACC-009 · **Issue:** M1-19 · **Route:** `/setup/household`

## Layout — mobile (360 px)

Scrolling content above a fixed footer.

1. **Progress**: "Step 1 of 4" (14/20, `text-secondary`) above a 4-segment bar (`role="img"`, `aria-label="Step 1 of 4"`; filled segments `brand`, empty `border`). Content padding 32 px top, 24 px sides, 120 px bottom to clear the footer.
2. `h1` "Your household" + "The type decides who can see private expenses and how costs are shared." (`text-secondary`).
3. Field "Household name" (input, pre-filled with the current name).
4. Fieldset "Who lives there?" — four radio cards (Card with radio, icon, title and description; selected card: 2 px `brand` border and `brand-tint` background):
   - Just me — A household of one
   - Family — Parents, children and relatives
   - Shared flat — Flatmates who share some costs
   - Something else — Choose your own rules later
5. **Footer** (fixed, `bg`, top `border`, padding `space-4` `space-6` `space-8`): two equal buttons, secondary "Back" and primary "Continue".

## Layout — desktop

Centred column (max 480 px); the footer becomes a normal row under the form.

## Components

StepProgress, Field + Input, RadioCard, Button (primary, secondary).

## Texts

`setup.step` "Step {n} of {total}" · `setup.household.title` "Your household" · `setup.household.lede` · `setup.household.name` "Household name" · `setup.household.who` "Who lives there?" · the four type titles and descriptions · `setup.back` "Back" · `setup.continue` "Continue".

## States

- **Validation**: name required (max 60 characters); error under the field.
- **Changing the type of an existing household**: before continuing, show the warning of FR-HH-007: "The new rules only apply to things created from now on." To become a Family, each member needs a family role first (decision Q3).
- **Back** on step 1 returns to the welcome screen. Answers are kept when going back and forward.

## Accessibility

The radio cards are real radio inputs in a `fieldset` with `legend`; arrow keys move the selection. Step changes are announced.
