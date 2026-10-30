// The pure parts of the feature: its index also brings server-only code, which Playwright cannot load.
import { defaultSettings } from "@/features/households/domain/household-rules";
import { householdSettingsSchemaFor } from "@/features/households/schemas";
import { verifiedAccount } from "./support/accounts";
import { createHouseholdAs } from "./support/database";
import { expectNoA11yViolations } from "./support/accessibility";
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

test.describe("FR-ACC-009 change the household type safely", () => {
  test("FR-HH-007 the owner creates a shared flat and turns it into a family after the warning and the roles", async ({
    page,
    visit,
  }) => {
    // Sign-up, two pages and four axe runs in both themes: close to the default 30 s on a busy CI.
    test.slow();
    await verifiedAccount(page, visit, "household-change", password);

    await visit("/settings");
    await page.getByRole("link", { name: "Create a new household" }).click();
    await expect(page.getByRole("heading", { name: "New household" })).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByLabel("Household name").fill("Calle Mayor 5");
    await page.getByRole("radio", { name: /Shared flat/ }).check();
    await page.getByRole("button", { name: "Create household" }).click();

    await expect(page.getByRole("heading", { name: "Calle Mayor 5" })).toBeVisible();
    await expect(page.getByText("Calle Mayor 5 is ready. You're its owner.")).toBeVisible();
    await expectNoA11yViolations(page);

    await page.getByRole("combobox", { name: "Type" }).selectOption("family");
    const warning = page.getByRole("dialog", { name: "Change to Family?" });
    await expect(warning).toBeVisible();
    await expectNoA11yViolations(page);
    await warning.getByRole("button", { name: "Continue" }).click();

    const roles = page.getByRole("dialog", { name: "Who is who in the family?" });
    await expect(roles.getByRole("combobox", { name: "You · Owner" })).toHaveValue("parent");
    await expectNoA11yViolations(page);
    await roles.getByRole("button", { name: "Change to Family" }).click();

    await expect(page.getByText("Calle Mayor 5 is now a family household.")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Type" })).toHaveValue("family");
  });

  test("FR-HH-007 Escape keeps the current type", async ({ page, visit }) => {
    await verifiedAccount(page, visit, "household-escape", password);
    await visit("/settings");
    await page.getByRole("link", { name: /Lucía's home/ }).click();

    await page.getByRole("combobox", { name: "Type" }).selectOption("other");
    await expect(page.getByRole("dialog", { name: "Change to Something else?" })).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("combobox", { name: "Type" })).toHaveValue("single");
    await expect(page.getByRole("combobox", { name: "Type" })).toBeFocused();
  });
});
