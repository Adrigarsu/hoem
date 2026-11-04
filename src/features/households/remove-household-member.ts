import "server-only";
import { revalidatePath } from "next/cache";
import type { ApiCredentials } from "@/lib/api-credentials";
import { ValidationError } from "@/lib/errors";
import { householdSettingsRoute } from "./paths";
import { householdGateway } from "./repository";
import { removeMemberSchema } from "./schemas";
import { removeMember } from "./service";

// Removing a member, for the Server Action and the REST route (ADR-020). Both parse with the same
// schema and refresh household settings, so other tabs stop listing someone who is gone.
export async function removeHouseholdMember(
  input: { householdId: string; userId: string },
  credentials: ApiCredentials = {},
) {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) throw ValidationError.fromZod(parsed.error);
  await removeMember(await householdGateway(credentials), parsed.data);
  revalidatePath(householdSettingsRoute, "page");
}
