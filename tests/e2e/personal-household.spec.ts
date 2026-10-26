import type { Page } from "@playwright/test";
import { defaultSettings, householdSettingsSchemaFor } from "@/features/households";
import { householdsOf } from "./support/database";
import { expect, test } from "./support/fixtures";
import { emailLink, uniqueEmail } from "./support/mailbox";

const password = "correct horse battery";

// Signs up as Lucía, opens the verification link and lands in the app.
async function verifiedAccount(page: Page, visit: (path: string) => Promise<void>) {
  const email = uniqueEmail("personal");
  await visit("/sign-up");
  await page.getByLabel("Your name").fill("Lucía");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Repeat the password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/check-your-inbox$/);
  await page.goto((await emailLink(email)).link);
  await expect(page).toHaveURL(/\/$/);
  return email;
}

test.describe("FR-ACC-003 personal household on sign-up", () => {
  // One sign-up checks both the household and its settings, which the trigger writes in SQL and
  // must equal the domain defaults.
  test("FR-ACC-003 sign-up creates a single-person household I own, named after me, with the domain rules", async ({
    page,
    visit,
  }) => {
    const email = await verifiedAccount(page, visit);

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
