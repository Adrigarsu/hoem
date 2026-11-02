import "server-only";
import { cache } from "react";
import { householdGateway } from "./repository";
import { activeHousehold } from "./service";

// The active household for this request (FR-ACC-004). The sidebar, the Home header and the page
// all ask for it, so it is read once per request.
export const currentHousehold = cache(async () => activeHousehold(await householdGateway()));
