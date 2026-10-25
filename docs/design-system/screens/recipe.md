# Recipe

**Reference:** `recipe.html` · **Requirements:** FR-MEAL-001, FR-MEAL-002, FR-INT-001, FR-INT-002 · **Issue:** M3 · **Route:** `/meals/recipes/[id]`

## Layout — mobile (360 px)

1. Top bar: back link "Meals" and IconButton "Edit recipe" (pencil).
2. Photo: not drawn on the canvas. If the recipe has a photo (it can be set in Edit recipe), show it here at 16:9 with `radius-lg`; otherwise show nothing.
3. `h1` "Lentil stew with rice"; meta row: clock icon "35 min" and tag Badges (`meals` tint): "Vegetarian", "Batch cooking".
4. Section `h2` "Ingredients" with a servings stepper (`aria-label="Servings"`: "Fewer servings", value "4 servings", "More servings").
5. Ingredient list (rows separated by `border`): name left, quantity right — Brown lentils 300 g · Rice 200 g · Carrots 2 · Onion 1 · Sweet paprika 1 tsp. Quantities scale with the servings.
6. Primary button, full width, sticky at the bottom: "Add ingredients to shopping list".

## Layout — desktop

Not designed. Two columns in the content area: photo + meta + steps on the left, ingredients card with the stepper and the button on the right (sticky).

## Components

Back link, IconButton, Image, Badge, Stepper, List, Button.

## Texts

`recipe.back` "Meals", `recipe.edit` "Edit recipe", `recipe.minutes` "{n} min", `recipe.ingredients` "Ingredients", `recipe.servings` "{n} servings", `recipe.fewer|more`, `recipe.addToList` "Add ingredients to shopping list".

## States

- **Add to list**: opens a sheet to choose ingredients (all ticked) and the list (shared or private), FR-INT-001; ingredients already on the list are merged (FR-INT-002).
- **No photo**: the title moves up; no placeholder.
- **Not found / deleted**: EmptyState with a link back to Meals.
