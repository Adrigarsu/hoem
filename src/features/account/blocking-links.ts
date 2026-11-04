import { householdSettingsPath } from "@/features/households";
import type { HandOverReason } from "./domain/account-deletion";
import type { BlockingHousehold } from "./service";

export type BlockingLink = { name: string; href: string; reasons: HandOverReason[] };

// Built on the server: the dialog is a Client Component, and the households feature's index also
// brings server-only code.
export function blockingLinks(households: readonly BlockingHousehold[]): BlockingLink[] {
  return households.map(({ id, name, reasons }) => ({
    name,
    href: householdSettingsPath(id),
    reasons,
  }));
}
