import { expect, type Page } from "@playwright/test";

// Sign out is the last entry of the profile and settings menu (FR-NAV-003). It waits for the sign-in
// page, so the next step does not act on the settings page that is still on its way out.
export async function signOut(page: Page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
}
