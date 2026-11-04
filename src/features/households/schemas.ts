import { z } from "zod";
import { formFieldErrors } from "@/lib/validation";
import {
  familyRoles,
  householdTypes,
  mealPlanOptions,
  mealSlots,
  privateExpenseOptions,
  roleOptions,
  settingsMisfits,
  type HouseholdType,
} from "./domain/household-rules";

// The shape of households.settings (jsonb). Strict, so a typo or a value outside the options is
// refused on write (#19, #31) and noticed on read, instead of silently changing who sees what.
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

// The forms of #19 (FR-ACC-009, FR-HH-007). Messages are keys under Households.validation.
export type ValidationKey = "required" | "tooLong" | "noParent";

export function fieldErrors(error: z.ZodError | undefined): Record<string, ValidationKey> {
  return formFieldErrors<ValidationKey>(error);
}

// The same limits as private.create_household, which checks them again.
const householdName = z.string().trim().min(1, { error: "required" }).max(60, { error: "tooLong" });
const householdId = z.uuid();

export const createHouseholdSchema = z.object({
  name: householdName,
  type: z.enum(householdTypes, { error: "required" }),
});

export const renameHouseholdSchema = z.object({ householdId, name: householdName });

// Family roles by member id; read only when the new type is family. Whether every member has one
// is checked by the service and the database, which know the members.
export const changeHouseholdTypeSchema = z.object({
  householdId,
  type: z.enum(householdTypes, { error: "required" }),
  familyRoles: z.record(z.uuid(), z.enum(familyRoles)).default({}),
});

// The household chosen in the switcher (FR-ACC-004).
export const switchHouseholdSchema = z.object({ householdId });

// Member management (FR-ACC-006, FR-HH-006). The member is named by their user id; who may change
// them is decided by the service and the database, which know the roles.
const memberId = z.uuid();

export const setMemberRoleSchema = z.object({
  householdId,
  userId: memberId,
  role: z.enum(["owner", "member"]),
});

export const changeFamilyRoleSchema = z.object({
  householdId,
  userId: memberId,
  familyRole: z.enum(familyRoles, { error: "required" }),
});

export const removeMemberSchema = z.object({ householdId, userId: memberId });

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type RenameHouseholdInput = z.infer<typeof renameHouseholdSchema>;
export type ChangeHouseholdTypeInput = z.infer<typeof changeHouseholdTypeSchema>;
export type SwitchHouseholdInput = z.infer<typeof switchHouseholdSchema>;
export type SetMemberRoleInput = z.infer<typeof setMemberRoleSchema>;
export type ChangeFamilyRoleInput = z.infer<typeof changeFamilyRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
