import { removeHouseholdMember } from "@/features/households";
import { apiCredentials } from "@/lib/api-credentials";
import { problemResponse } from "@/lib/problem-details";
import { limitWrites } from "@/lib/rate-limit";
import { uuidV7 } from "@/lib/uuid-v7";

type Context = RouteContext<"/api/v1/households/[id]/members/[userId]">;

// Removes a member of the household (FR-ACC-006). The web app sends it with keepalive when the page
// unloads during the 5-second undo, since a Server Action would be cancelled with the page
// (ADR-020). Repeating it is harmless: someone already gone is not an error.
export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const { id, userId } = await params;
  try {
    const credentials = apiCredentials(request.headers);
    await limitWrites(credentials);
    await removeHouseholdMember({ householdId: id, userId }, credentials);
    return new Response(null, { status: 204 });
  } catch (error) {
    return problemResponse(error, {
      instance: `/api/v1/households/${id}/members/${userId}`,
      requestId: uuidV7(),
    });
  }
}
