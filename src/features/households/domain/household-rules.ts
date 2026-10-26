// The rules each household type sets (SRS 3.7, FR-HH-001, FR-ACC-010). A household stores them in
// households.settings when it is created, so later changes affect only new records (ADR-006).

// Same values as the database enums (src/db/schema/households.ts); a test keeps them in sync.
export const householdTypes = ["single", "family", "shared_flat", "other"] as const;
export const familyRoles = ["parent", "child", "relative"] as const;
export const mealSlots = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
] as const;

// The options of each rule, shared with the Zod schema so they are written once.
export const roleOptions = ["owner_only", "family", "owner_or_member"] as const;
export const mealPlanOptions = ["personal", "shared_only", "shared_and_private"] as const;
export const privateExpenseOptions = ["creator", "creator_and_parents_for_children"] as const;

export type HouseholdType = (typeof householdTypes)[number];
export type FamilyRole = (typeof familyRoles)[number];
export type MealSlot = (typeof mealSlots)[number];

export type HouseholdSettings = {
  // owner_only: one person. family: parent, child or relative. owner_or_member: owners and members.
  roles: (typeof roleOptions)[number];
  privateShoppingLists: boolean;
  // Family splitting is between parents and off until the parents enable it (FR-HH-009).
  splitting:
    { mode: "off" } | { mode: "between_parents"; enabled: boolean } | { mode: "each_member" };
  // shared_only: one plan for the whole family; shared_and_private: shared plus each member's own.
  mealPlan: (typeof mealPlanOptions)[number];
  // Who sees a private expense besides its creator: nobody, or the parents when a child created it.
  privateExpenses: (typeof privateExpenseOptions)[number];
  // The daily meal slots the household uses (FR-ONB-003, FR-MEAL-007).
  mealSlots: MealSlot[];
};

const sharedFlat: HouseholdSettings = {
  roles: "owner_or_member",
  privateShoppingLists: true,
  splitting: { mode: "each_member" },
  mealPlan: "shared_and_private",
  privateExpenses: "creator",
  mealSlots: [...mealSlots],
};

const defaults: Record<HouseholdType, HouseholdSettings> = {
  single: {
    roles: "owner_only",
    privateShoppingLists: false,
    splitting: { mode: "off" },
    mealPlan: "personal",
    privateExpenses: "creator",
    mealSlots: [...mealSlots],
  },
  family: {
    roles: "family",
    privateShoppingLists: true,
    splitting: { mode: "between_parents", enabled: false },
    mealPlan: "shared_only",
    privateExpenses: "creator_and_parents_for_children",
    mealSlots: [...mealSlots],
  },
  shared_flat: sharedFlat,
  // "Other" starts like a shared flat; the owner adjusts it later (FR-HH-010).
  other: sharedFlat,
};

export function defaultSettings(type: HouseholdType): HouseholdSettings {
  return structuredClone(defaults[type]);
}

// The settings a type does not allow, by name, so a form can point at each one. Single, family and
// shared flat have fixed rules: only the meal slots and, in a family, whether splitting is enabled
// can change. An "other" household can have several members and picks among the options the other
// types use, except the family ones: family roles exist only in family households (the database
// refuses them elsewhere), so parents seeing private records and splitting between parents would
// do nothing there.
export function settingsMisfits(
  type: HouseholdType,
  settings: HouseholdSettings,
): (keyof HouseholdSettings)[] {
  const misfits: (keyof HouseholdSettings)[] = [];
  if (type === "other") {
    if (settings.roles !== "owner_or_member") misfits.push("roles");
    if (settings.splitting.mode === "between_parents") misfits.push("splitting");
    if (settings.privateExpenses !== "creator") misfits.push("privateExpenses");
    return misfits;
  }
  const fixed = defaults[type];
  if (settings.roles !== fixed.roles) misfits.push("roles");
  if (settings.privateShoppingLists !== fixed.privateShoppingLists) {
    misfits.push("privateShoppingLists");
  }
  if (settings.splitting.mode !== fixed.splitting.mode) misfits.push("splitting");
  if (settings.mealPlan !== fixed.mealPlan) misfits.push("mealPlan");
  if (settings.privateExpenses !== fixed.privateExpenses) misfits.push("privateExpenses");
  return misfits;
}

// A new type brings its own rules, so records created after the change follow them (FR-HH-007);
// the meal slots the household chose stay. Used by the type change in #19.
export function settingsAfterTypeChange(
  type: HouseholdType,
  current: HouseholdSettings,
): HouseholdSettings {
  return { ...defaultSettings(type), mealSlots: [...current.mealSlots] };
}

// Whether a private expense is also visible to the parents, decided when it is written (ADR-006):
// only a child's, and only where the household's rules say so (FR-HH-002, FR-HH-004, FR-HH-008).
// Expenses only: private shopping lists, meal plans and notes stay with their creator in every
// household type (FR-HH-005). The expense trigger in M4 applies the same rule in SQL.
export function privateExpenseVisibleToParents(
  settings: HouseholdSettings,
  authorFamilyRole: FamilyRole | null,
): boolean {
  return (
    settings.privateExpenses === "creator_and_parents_for_children" && authorFamilyRole === "child"
  );
}
