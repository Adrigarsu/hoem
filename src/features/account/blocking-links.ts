import { householdSettingsPath } from "@/features/households";
import type { BlockingHousehold } from "./service";

export type BlockingLink = { name: string; href: string };

// Built on the server: the dialog is a Client Component, and the households feature's index also
// brings server-only code.
export function blockingLinks(households: readonly BlockingHousehold[]): BlockingLink[] {
  return households.map(({ id, name }) => ({ name, href: householdSettingsPath(id) }));
}
