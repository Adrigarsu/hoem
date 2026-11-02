"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { householdSettingsPath } from "./paths";
import { householdGateway } from "./repository";
import {
  changeHouseholdTypeSchema,
  createHouseholdSchema,
  fieldErrors,
  renameHouseholdSchema,
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

// The route as the file system names it, with its locale segment and route group, not one URL.
const settingsRoute = "/[locale]/(app)/settings/household/[id]";

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
