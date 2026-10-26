import { z } from "zod";
import {
  mealPlanOptions,
  mealSlots,
  privateExpenseOptions,
  roleOptions,
  settingsMisfits,
  type HouseholdType,
} from "./domain/household-rules";

// The shape of households.settings (jsonb). Strict, so a typo or a value outside the options is
// refused on write (#16, #31) and noticed on read, instead of silently changing who sees what.
// Messages are keys, like every schema in the app (docs/architecture.md §4.2).
export const householdSettingsSchema = z.strictObject({
  roles: z.enum(roleOptions),
  privateShoppingLists: z.boolean(),
  splitting: z.discriminatedUnion("mode", [
    z.strictObject({ mode: z.literal("off") }),
    z.strictObject({ mode: z.literal("between_parents"), enabled: z.boolean() }),
    z.strictObject({ mode: z.literal("each_member") }),
  ]),
  mealPlan: z.enum(mealPlanOptions),
  privateExpenses: z.enum(privateExpenseOptions),
  mealSlots: z
    .array(z.enum(mealSlots))
    .min(1, { error: "required" })
    .refine((slots) => new Set(slots).size === slots.length, { error: "duplicateMealSlot" })
    // Always in the order of the day, whatever order the form sent.
    .transform((slots) => mealSlots.filter((slot) => slots.includes(slot))),
});

// What a household of this type may store: one issue per setting it does not allow.
export function householdSettingsSchemaFor(type: HouseholdType) {
  return householdSettingsSchema.superRefine((settings, context) => {
    for (const field of settingsMisfits(type, settings)) {
      context.addIssue({ code: "custom", path: [field], message: "notAllowedForType" });
    }
  });
}
