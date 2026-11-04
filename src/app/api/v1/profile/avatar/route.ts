import { removeOwnPhoto } from "@/features/profile";
import { apiCredentials } from "@/lib/api-credentials";
import { problemResponse } from "@/lib/problem-details";
import { uuidV7 } from "@/lib/uuid-v7";

const instance = "/api/v1/profile/avatar";

// Removes the caller's own photo (FR-ACC-007). The web app sends it with keepalive when the page
// unloads during the 5-second undo, since a Server Action would be cancelled with the page
// (ADR-020). Repeating it is harmless: without a photo it does nothing.
export async function DELETE(request: Request): Promise<Response> {
  try {
    await removeOwnPhoto(apiCredentials(request.headers));
    return new Response(null, { status: 204 });
  } catch (error) {
    return problemResponse(error, { instance, requestId: uuidV7() });
  }
}
