import type { Page } from "@playwright/test";
import { verifiedAccount } from "./support/accounts";
import { expectNoA11yViolations } from "./support/accessibility";
import { createHouseholdAs, deleteHouseholdAs } from "./support/database";
import { expect, test } from "./support/fixtures";
import { signOut } from "./support/session";

const password = "correct horse battery";

// The Home header on phones, the sidebar on wider screens: only one of them is visible.
const switcher = (page: Page) => page.getByRole("button", { name: /switch household$/ });
const household = (page: Page, name: string) =>
  page.getByRole("menuitemradio", { name: new RegExp(`^${name}`) });

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("FR-ACC-004 switch the active household", () => {
  test("FR-ACC-004 lists my households, switches and keeps the choice after a reload and a new sign-in", async ({
    page,
    visit,
  }) => {
    // Sign-up, two sign-ins and axe on the open menu: close to the default 30 s on a busy CI.
    test.slow();
    const email = await verifiedAccount(page, visit, "switcher", password);
    await createHouseholdAs(email, password, "Calle Mayor 5", "shared_flat");

    await visit("/");
    await expect(switcher(page)).toHaveAccessibleName(/^Lucía's home/);
    await switcher(page).click();
    await expect(household(page, "Lucía's home")).toHaveAttribute("aria-checked", "true");
    await expect(household(page, "Calle Mayor 5")).toHaveAccessibleName(/Shared flat · 1 member$/);
    await expect(household(page, "Calle Mayor 5")).toHaveAttribute("aria-checked", "false");
    await expectNoA11yViolations(page);

    await household(page, "Calle Mayor 5").click();
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(switcher(page)).toHaveAccessibleName(/^Calle Mayor 5/);

    await page.reload();
    await expect(switcher(page)).toHaveAccessibleName(/^Calle Mayor 5/);

    await signOut(page);
    await expect(page).toHaveURL(/\/sign-in/);
    await signIn(page, email);
    await expect(switcher(page)).toHaveAccessibleName(/^Calle Mayor 5/);
  });

  test("FR-ACC-004 opens the switcher, moves between households and chooses one with the keyboard", async ({
    page,
    visit,
  }) => {
    const email = await verifiedAccount(page, visit, "switcher-keys", password);
    await createHouseholdAs(email, password, "Calle Mayor 5", "shared_flat");

    await visit("/");
    await switcher(page).focus();
    await page.keyboard.press("Enter");
    await expect(household(page, "Lucía's home")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(household(page, "Calle Mayor 5")).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("menu")).toBeHidden();
    await expect(switcher(page)).toBeFocused();
    await expect(switcher(page)).toHaveAccessibleName(/^Calle Mayor 5/);

    await page.keyboard.press("ArrowDown");
    await expect(household(page, "Calle Mayor 5")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(switcher(page)).toBeFocused();
  });

  test("FR-ACC-004 never shows a household I no longer belong to", async ({ page, visit }) => {
    const email = await verifiedAccount(page, visit, "switcher-left", password);
    await createHouseholdAs(email, password, "Calle Mayor 5", "shared_flat");
    await visit("/");
    await switcher(page).click();
    await household(page, "Calle Mayor 5").click();
    await expect(switcher(page)).toHaveAccessibleName(/^Calle Mayor 5/);

    await deleteHouseholdAs(email, password, "Calle Mayor 5");
    await page.reload();

    await expect(switcher(page)).toHaveAccessibleName(/^Lucía's home/);
    await switcher(page).click();
    await expect(page.getByRole("menuitemradio")).toHaveCount(1);
  });
});
