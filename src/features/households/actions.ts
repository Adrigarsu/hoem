"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { FamilyRole } from "./domain/household-rules";
import { householdSettingsPath, householdSettingsRoute as settingsRoute } from "./paths";
import { removeHouseholdMember } from "./remove-household-member";
import { householdGateway } from "./repository";
import {
  changeFamilyRoleSchema,
  changeHouseholdTypeSchema,
  createHouseholdSchema,
  fieldErrors,
  renameHouseholdSchema,
  setMemberRoleSchema,
  switchHouseholdSchema,
  type ValidationKey,
} from "./schemas";
import * as households from "./service";

// Thin entry points: parse with the shared schema, call the service, map the result to form state.
export type HouseholdFormState = {
  status: "idle" | "invalid" | "refused" | "saved";
  fieldErrors?: Record<string, ValidationKey>;
  refusal?: households.TypeChangeRefusal | "minorCreator";
  values?: { name?: string; type?: string; familyRoles?: Record<string, string> };
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// The family roles travel as one select per member, named familyRoles.<user id>; an unanswered
// select sends an empty value, which is the same as no role.
function familyRolesOf(formData: FormData): Record<string, string> {
  const roles: Record<string, string> = {};
  for (const [name, value] of formData) {
    if (name.startsWith("familyRoles.") && typeof value === "string" && value) {
      roles[name.slice("familyRoles.".length)] = value;
    }
  }
  return roles;
}

export async function createHouseholdAction(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const values = { name: text(formData, "name"), type: text(formData, "type") };
  const parsed = createHouseholdSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }
  let id: string;
  try {
    id = await households.createHousehold(await householdGateway(), parsed.data);
  } catch (error) {
    if (error instanceof households.MinorCannotCreateError) {
      return { status: "refused", refusal: "minorCreator", values };
    }
    throw error;
  }
  // #20 makes it the active household and #32 opens the setup guide; until then its settings page
  // is where the user lands.
  redirect(`${householdSettingsPath(id)}?created=1`);
}

export async function renameHouseholdAction(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const values = { name: text(formData, "name") };
  const parsed = renameHouseholdSchema.safeParse({
    ...values,
    householdId: text(formData, "householdId"),
  });
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }
  await households.renameHousehold(await householdGateway(), parsed.data);
  revalidatePath(settingsRoute, "page");
  return { status: "saved", values };
}

export async function changeHouseholdTypeAction(
  _: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const values = { type: text(formData, "type"), familyRoles: familyRolesOf(formData) };
  const parsed = changeHouseholdTypeSchema.safeParse({
    ...values,
    householdId: text(formData, "householdId"),
  });
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }
  try {
    await households.changeHouseholdType(await householdGateway(), parsed.data);
  } catch (error) {
    // The household may have changed since the page loaded (someone joined): refresh it, so the
    // roles dialog and the refusals show the members as they are now.
    revalidatePath(settingsRoute, "page");
    if (error instanceof households.TypeChangeRefusedError) {
      return { status: "refused", refusal: error.reason, values };
    }
    if (error instanceof ValidationError) {
      return {
        status: "invalid",
        fieldErrors: Object.fromEntries(
          error.fieldErrors.map(({ field, code }) => [field ?? "type", code as ValidationKey]),
        ),
        values,
      };
    }
    throw error;
  }
  revalidatePath(settingsRoute, "page");
  return { status: "saved", values };
}

// The switcher (FR-ACC-004). Every page shows the active household, so the whole app is refreshed.
// False when nothing changed: a household the user just left is not an error, the refresh drops it
// from the list.
export async function switchHouseholdAction(householdId: string): Promise<boolean> {
  revalidatePath("/", "layout");
  const parsed = switchHouseholdSchema.safeParse({ householdId });
  if (!parsed.success) return false;
  try {
    await households.switchHousehold(await householdGateway(), parsed.data);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) return false;
    throw error;
  }
}

// Member management (FR-ACC-006, FR-HH-006). "refused" carries why, so the dialog says what to do
// first; "stale" means the members changed since the page loaded, and the refreshed page shows them.
export type MemberFormState = {
  status: "idle" | "saved" | "refused" | "stale";
  refusal?: households.MemberChangeRefusal;
  // The family role that was saved, for the confirmation.
  familyRole?: FamilyRole;
};

async function memberChange(change: () => Promise<void>): Promise<MemberFormState> {
  try {
    await change();
    return { status: "saved" };
  } catch (error) {
    if (error instanceof households.MemberChangeRefusedError) {
      return { status: "refused", refusal: error.reason };
    }
    // Someone else changed the household meanwhile: the refresh below shows it as it is now.
    if (error instanceof ForbiddenError || error instanceof NotFoundError)
      return { status: "stale" };
    throw error;
  } finally {
    revalidatePath(settingsRoute, "page");
  }
}

export async function setMemberRoleAction(
  _: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const parsed = setMemberRoleSchema.safeParse({
    householdId: text(formData, "householdId"),
    userId: text(formData, "userId"),
    role: text(formData, "role"),
  });
  // Only a tampered request sends something else: the form offers no free input.
  if (!parsed.success) return { status: "stale" };
  return memberChange(async () => households.setMemberRole(await householdGateway(), parsed.data));
}

export async function changeFamilyRoleAction(
  _: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const parsed = changeFamilyRoleSchema.safeParse({
    householdId: text(formData, "householdId"),
    userId: text(formData, "userId"),
    familyRole: text(formData, "familyRole"),
  });
  if (!parsed.success) return { status: "stale" };
  const result = await memberChange(async () =>
    households.changeFamilyRole(await householdGateway(), parsed.data),
  );
  return { ...result, familyRole: parsed.data.familyRole };
}

// Called by the undo timer once the 5 seconds are over (ADR-009). False when nothing was removed,
// so the member comes back with a message.
export async function removeMemberAction(householdId: string, userId: string): Promise<boolean> {
  try {
    await removeHouseholdMember({ householdId, userId });
    return true;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ForbiddenError) {
      revalidatePath(settingsRoute, "page");
      return false;
    }
    throw error;
  }
}
