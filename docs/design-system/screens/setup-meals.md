# Setup guide: step 2, meals

**Reference:** `setup-meals.html` · **Requirements:** FR-ONB-003, FR-MEAL-007 · **Issue:** M1-20 · **Route:** `/setup/meals`

## Layout — mobile (360 px)

Same frame as step 1 (progress "Step 2 of 4", fixed footer Back / Continue).

1. `h1` "Which meals do you plan?" + "Only these will appear in your weekly plan."
2. Fieldset "Meals to plan": five checkbox rows in a Card, separated by `border` lines, all checked by default — Breakfast, Morning snack, Lunch, Afternoon snack, Dinner.
3. "Usual number of servings": stepper (− value +; IconButtons "Fewer servings" / "More servings"), helper "Recipes scale their ingredients to this by default."

## Layout — desktop

Centred column, max 480 px.

## Components

StepProgress, Checkbox rows in a Card, Stepper, Button.

## Texts

`setup.meals.title`, `setup.meals.lede`, `setup.meals.slots` "Meals to plan", the five slot names (shared with Meals), `setup.meals.servings` "Usual number of servings", `setup.meals.servingsHelp`.

## States

- At least one slot must stay selected: "Choose at least one meal."
- Servings between 1 and 12; the − button is disabled at 1, + at 12.

## Accessibility

The stepper value is an `<output>` (or input type number) labelled by the field label; the buttons announce the new value.
