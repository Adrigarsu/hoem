"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { blockingLinks, type BlockingLink } from "./blocking-links";
import { accountGateway } from "./repository";
import { deleteAccountSchema, fieldErrors, type ValidationKey } from "./schemas";
import { deleteAccount, HandOverFirstError, WrongConfirmationError } from "./service";

// The route as the file system names it: this layout holds the header and the sidebar.
const appLayout = "/[locale]/(app)";

export type DeleteAccountState = {
  status: "idle" | "invalid" | "blocked" | "failed";
  fieldErrors?: Record<string, ValidationKey>;
  households?: BlockingLink[];
  values?: { confirmation: string };
};

export async function deleteAccountAction(
  _: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirmation = formData.get("confirmation");
  const values = { confirmation: typeof confirmation === "string" ? confirmation : "" };
  const parsed = deleteAccountSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }
  try {
    await deleteAccount(await accountGateway(), parsed.data);
  } catch (error) {
    // The database may refuse after the photo is gone, whatever the reason: the header and the
    // sidebar must stop asking for it.
    revalidatePath(appLayout, "layout");
    if (error instanceof WrongConfirmationError) {
      return { status: "invalid", fieldErrors: { confirmation: "wrongEmail" }, values };
    }
    if (error instanceof HandOverFirstError) {
      return { status: "blocked", households: blockingLinks(error.households) };
    }
    console.error("Could not delete the account", error);
    return { status: "failed", values };
  }
  redirect("/sign-in?deleted=1");
}
