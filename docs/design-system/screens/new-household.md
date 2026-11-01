# New household

**Reference:** `new-household.html` (variant A) · **Requirements:** FR-ACC-009, FR-HH-001 · **Issue:** #19 · **Route:** `/households/new`

## Layout — mobile (360 px)

No app shell (like the setup guide). Content padding 24 px top and sides; the footer sticks to the
bottom of the screen.

1. Back link "Back" (to Settings).
2. `h1` "New household" + "The type decides who can see private expenses and how costs are shared. You can change it later." (`text-secondary`).
3. Field "Household name".
4. Fieldset "Who lives there?" — four RadioCards, none pre-chosen: Just me, Family, Shared flat, Something else, each with its description (same texts as `setup-household`).
5. **Footer**: secondary "Cancel" and primary "Create household", two equal columns.

## Layout — desktop

Centred column (`column`, 480 px), 64 px from the top; the footer becomes a right-aligned row under
the form.

## Components

TextField, RadioCard, Button (primary, secondary).

## Texts

`Households.new.*`, `Households.types.*`, `Households.typeDescriptions.*`,
`Households.validation.required|tooLong|typeRequired`.

## States

- **Validation**: name required, at most 60 characters ("Give the household a name"); a type must be chosen ("Choose who lives there"). Focus goes to the first field with an error.
- **Submitting**: "Creating…", button busy but focusable.
- **Created**: the household's settings page opens with "{name} is ready. You're its owner." Once #20 and #32 exist, the new household becomes the active one and the setup guide opens instead.

## Later (#32)

Variant B in the reference: creating becomes step 1 of the setup guide, with "Step 1 of 4", so name
and type are not asked twice.
