import "server-only";
import { revalidatePath } from "next/cache";
import type { ApiCredentials } from "@/lib/api-credentials";
import { appLayout } from "./app-layout";
import { profileGateway } from "./repository";
import { removePhoto } from "./service";

// The signed-in user's photo, for the Server Action and the REST route (ADR-020). Both refresh the
// layout, so other tabs and later visits stop offering a photo that is gone.
export async function removeOwnPhoto(credentials: ApiCredentials = {}) {
  await removePhoto(await profileGateway(credentials));
  revalidatePath(appLayout, "layout");
}
