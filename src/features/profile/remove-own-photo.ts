import "server-only";
import type { ApiCredentials } from "@/lib/api-credentials";
import { profileGateway } from "./repository";
import { removePhoto } from "./service";

// The signed-in user's photo, for the Server Action and the REST route (ADR-020).
export async function removeOwnPhoto(credentials: ApiCredentials = {}) {
  await removePhoto(await profileGateway(credentials));
}
