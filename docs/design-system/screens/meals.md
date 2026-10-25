# Meals

**Reference:** `meals.html` · **Requirements:** FR-MEAL-003 to 005, FR-MEAL-007, FR-INT-001, FR-HH-005 · **Issue:** M3 · **Route:** `/meals`

## Layout — mobile (360 px)

1. Avatar button top right.
2. Header: `h1` "Meals", "Week of 5 October" (`text-secondary`), secondary button with book icon (`meals`) "Recipes".
3. **Day strip** (`aria-label="Days of the week"`): 7 day buttons (short day + number). Today/selected: solid `meals` background with `on-accent` text; the rest neutral.
4. `h2` with the selected date: "Wednesday 7 October".
5. One card per meal slot in use (default five; only the slots chosen in setup):
   - Slot name as eyebrow (Breakfast, Morning snack, Lunch, Afternoon snack, Dinner).
   - Planned: dish name (16/24, 600), meta "2 servings · 5 min", IconButton "Add ingredients of {dish} to the shopping list" (cart-plus, `shopping`).
   - Empty: dashed `border-control` button "Add a meal" (`aria-label="Add a meal to Wednesday morning snack"`).
6. Tab bar with Meals current.

## Layout — desktop (1440 px)

Sidebar (Meals current). Header: `h1` "Meals", week navigation (IconButtons "Previous week" / "Next week" around "5 – 11 October"), secondary "Recipes".
**Week grid** (`role="table"`, `aria-label="Meal plan, week of 5 October"`, min width 960 px, horizontal scroll below that): first column = slot names (eyebrow), 7 day columns; today's header in solid `meals`. Filled cell: Card with dish (14/20, 600) and "2 servings"; empty cell: dashed "+ Add" button with a full label. Under the grid: info line "Drag a meal to another day, or open it to move it with the keyboard."

## Components

Button, IconButton, DayStrip, MealSlot (filled / empty), Week grid, Eyebrow.

## Texts

`meals.title`, `meals.weekOf` "Week of {date}", `meals.recipes` "Recipes", slot names, `meals.addMeal` "Add a meal", `meals.addMealTo` "Add a meal to {day} {slot}", `meals.servingsTime` "{servings} servings · {minutes} min", `meals.addIngredients` "Add ingredients of {dish} to the shopping list", `meals.dragHint`.

## States

- **Ingredients added**: Toast "5 ingredients added to the shared list" with "Undo" and "Open list".
- **Empty week**: every slot shows "Add a meal"; a hint card offers "Copy last week" (Could, phase 2 — hide in MVP).
- **Private plans** (shared flats and other households, FR-HH-005): a segmented control "Shared plan / My plan" under the header. Families have only the shared plan.
- **Loading**: skeleton cards per slot.

## Accessibility

Today is marked with `aria-current="date"` in the day strip (also shown by the solid fill, not colour alone: it is the only filled day); the selected day is announced by the `h2` below. moving a meal must be possible without drag (Move to… menu).
