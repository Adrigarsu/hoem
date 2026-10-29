import { defaultSettings, householdSettingsSchemaFor } from "@/features/households";
import { householdsOf } from "./support/database";
import { expect, test } from "./support/fixtures";
import { verifiedAccount } from "./support/accounts";

const password = "correct horse battery";

test.describe("FR-ACC-003 personal household on sign-up", () => {
  // One sign-up checks both the household and its settings, which the trigger writes in SQL and
  // must equal the domain defaults.
  test("FR-ACC-003 sign-up creates a single-person household I own, named after me, with the domain rules", async ({
    page,
    visit,
  }) => {
    const email = await verifiedAccount(page, visit, "personal", password);

    const households = await householdsOf(email, password);

    expect(households).toEqual([
      {
        name: "Lucía's home",
        type: "single",
        settings: expect.anything(),
        memberships: [{ role: "owner" }],
      },
    ]);
    expect(householdSettingsSchemaFor("single").parse(households[0]?.settings)).toEqual(
      defaultSettings("single"),
    );
  });
});
