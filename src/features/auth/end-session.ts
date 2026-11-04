import "server-only";
import { authGateway } from "./repository";
import { endSession } from "./service";

// Where a page sends a browser whose session Supabase no longer knows (see the service).
export const sessionEndedPath = "/auth/session-ended";

export async function endSessionHere(): Promise<string> {
  return endSession(await authGateway());
}
