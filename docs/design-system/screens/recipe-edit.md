# Edit recipe

**Reference:** `recipe-edit.html` · **Requirements:** FR-MEAL-001, FR-MEAL-002 · **Issue:** M3 · **Route:** `/meals/recipes/new`, `/meals/recipes/[id]/edit`

## Layout — mobile (360 px)

Full-screen form `aria-label="Edit recipe"`.

1. Top bar: ghost "Cancel", `h1` "Edit recipe" (or "New recipe"), primary small "Save".
2. Photo with secondary button "Change photo".
3. Field "Name".
4. Two fields side by side: "Time (min)" and "Servings".
5. Fieldset "Tags": toggle chips — Vegetarian, Batch cooking, Quick, Kids (selected: `meals-tint` / `meals-ink` with check icon).
6. Fieldset "Ingredients": numbered rows; each row has "Ingredient {n}" (name input), quantity input ("Quantity of Brown lentils"), unit select ("Unit of Brown lentils": g, kg, ml, l, units, tsp, tbsp, cup, pack) and IconButton "Remove Brown lentils".
7. Ghost button with plus: "Add ingredient".

## Layout — desktop

Not designed. Same form in a centred column, max 640 px, with the ingredient row on one line.

## Components

Button, Image upload, Field + Input, Select, Chip (toggle), IconButton.

## Texts

`recipe.form.cancel|title|new|save`, `recipe.form.changePhoto`, `recipe.form.name`, `recipe.form.time` "Time (min)", `recipe.form.servings`, `recipe.form.tags`, tag names, `recipe.form.ingredients`, `recipe.form.ingredientN` "Ingredient {n}", `recipe.form.quantityOf` "Quantity of {name}", `recipe.form.unitOf` "Unit of {name}", `recipe.form.remove` "Remove {name}", `recipe.form.addIngredient`, unit names.

## States

- **Validation**: name required; at least one ingredient; quantity > 0 with up to 3 decimals.
- **Photo**: JPEG/PNG/WebP up to 5 MB; error under the photo.
- **Unsaved changes + Cancel**: confirm "Discard changes?".
- **Removing an ingredient**: immediate, with undo toast.
