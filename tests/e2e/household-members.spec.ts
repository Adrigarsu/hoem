import { verifiedAccount } from "./support/accounts";
import { expectNoA11yViolations } from "./support/accessibility";
import { expect, test } from "./support/fixtures";

const password = "correct horse battery";

// Households with several people need invitations (#27, #28); until then this covers what one
// account sees. The rules between members are tested with every role in
// supabase/tests/database/household-members.test.sql and in the unit tests.
test.describe("FR-ACC-006 see household members and manage their roles", () => {
  test("FR-ACC-006 the owner sees themselves in the member list and must name another owner before stepping down", async ({
    page,
    visit,
  }) => {
    test.slow();
    await verifiedAccount(page, visit, "household-members", password);
    await visit("/settings");
    await page.getByRole("link", { name: /Lucía's home/ }).click();
    await expect(page.getByRole("heading", { name: "Lucía's home", level: 1 })).toBeVisible();

    const members = page.getByRole("region", { name: "Members" });
    await expect(members.getByText("Lucía (you)")).toBeVisible();
    await expect(members.getByText("Owner", { exact: true })).toBeVisible();

    await members.getByRole("button", { name: "Options for Lucía" }).click();
    const options = page.getByRole("dialog", { name: "Options for Lucía" });
    await expect(options.getByText("Make someone else owner first.")).toBeVisible();
    await expect(options.getByRole("button", { name: "Remove from household" })).toHaveCount(0);
    await expectNoA11yViolations(page);

    await page.keyboard.press("Escape");
    await expect(options).toBeHidden();
    await expect(members.getByRole("button", { name: "Options for Lucía" })).toBeFocused();
  });
});
