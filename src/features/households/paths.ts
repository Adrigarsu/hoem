// Until #20 adds an active household, settings name the household in the path.
export const householdSettingsPath = (householdId: string) => `/settings/household/${householdId}`;

export const newHouseholdPath = "/households/new";

// The settings route as the file system names it, with its locale segment and route group, for
// revalidatePath; not a URL.
export const householdSettingsRoute = "/[locale]/(app)/settings/household/[id]";

// The REST resource of one member, which the web app calls with keepalive when the page closes
// during the undo of a removal (ADR-020).
export const memberApiPath = (householdId: string, userId: string) =>
  `/api/v1/households/${householdId}/members/${userId}`;
