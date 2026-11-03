import type { Page } from "@playwright/test";
import { verifiedAccount } from "./support/accounts";
import { expect, test } from "./support/fixtures";

const password = "correct horse battery";

function isPhone(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 768;
}

async function expectEverySection(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: "Profile and settings" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Account" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Household" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Preferences" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Privacy and data" })).toBeVisible();
  if (isPhone(page)) {
    await expect(page.getByRole("link", { name: "Edit profile" })).toBeVisible();
    // A hidden comma puts a pause between the label and the value when read aloud.
    await expect(page.getByRole("link", { name: /^Appearance ?, ?System$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Language ?, ?English$/ })).toBeVisible();
  } else {
    await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Language" })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Notifications", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

test.describe("FR-NAV-003 profile and settings", () => {
  let email = "";

  test.beforeEach(async ({ page, visit }) => {
    email = await verifiedAccount(page, visit, "settings", password);
  });

  test("FR-NAV-003 phones open it from the avatar", async ({ page, visit }) => {
    test.skip(!isPhone(page), "The avatar button is for phones");
    await page.getByRole("link", { name: "Profile and settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    // The page streams in after the URL changes; let the navigation finish before reloading it.
    await expect(
      page.getByRole("heading", { level: 1, name: "Profile and settings" }),
    ).toBeVisible();
    await visit("/settings");

    await expectEverySection(page);
    await expect(page.getByRole("region", { name: "Account" })).toContainText(email);
  });

  test("FR-NAV-003 wider screens open it from the bottom of the sidebar", async ({
    page,
    visit,
  }) => {
    test.skip(isPhone(page), "The sidebar is for wider screens");
    await page.getByRole("link", { name: "Lucía Profile and settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    // The page streams in after the URL changes; let the navigation finish before reloading it.
    await expect(
      page.getByRole("heading", { level: 1, name: "Profile and settings" }),
    ).toBeVisible();
    await visit("/settings");

    await expectEverySection(page);
    await expect(page.getByRole("link", { name: "Lucía Profile and settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("FR-NAV-003 a section that is not built yet says it is coming soon", async ({
    page,
    visit,
  }) => {
    await visit("/settings");
    await page.getByRole("link", { name: "Notifications", exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/notifications$/);
    await visit("/settings/notifications");

    await expect(page.getByRole("heading", { level: 1, name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Coming soon" })).toBeVisible();
    await page.getByRole("link", { name: "Back to settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("FR-NAV-003 Sign out ends the session and shows the sign-in page", async ({
    page,
    visit,
  }) => {
    await visit("/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    // Without a session the page is out of reach: the proxy sends it back to sign-in.
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
