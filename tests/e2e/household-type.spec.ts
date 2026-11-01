import { defaultSettings, householdSettingsSchemaFor } from "@/features/households";
import { verifiedAccount } from "./support/accounts";
import { createHouseholdAs } from "./support/database";
import { expect, test } from "./support/fixtures";

const password = "correct horse battery";

test.describe("FR-ACC-009 create a household with a type", () => {
  // The database chooses the rules of a new household (private.default_household_settings); they
  // must equal the domain defaults, which the rest of the app reads.
  test("FR-HH-001 a new household of each type stores the domain rules of that type", async ({
    page,
    visit,
  }) => {
    const email = await verifiedAccount(page, visit, "household-type", password);

    const stored = {
      single: await createHouseholdAs(email, password, "Just me", "single"),
      family: await createHouseholdAs(email, password, "García family", "family"),
      shared_flat: await createHouseholdAs(email, password, "Calle Mayor 5", "shared_flat"),
      other: await createHouseholdAs(email, password, "Something else", "other"),
    };

    expect({
      single: householdSettingsSchemaFor("single").parse(stored.single),
      family: householdSettingsSchemaFor("family").parse(stored.family),
      shared_flat: householdSettingsSchemaFor("shared_flat").parse(stored.shared_flat),
      other: householdSettingsSchemaFor("other").parse(stored.other),
    }).toEqual({
      single: defaultSettings("single"),
      family: defaultSettings("family"),
      shared_flat: defaultSettings("shared_flat"),
      other: defaultSettings("other"),
    });
  });
});
