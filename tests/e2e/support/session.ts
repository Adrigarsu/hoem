import type { Page } from "@playwright/test";

// Sign-out lives on the settings page until #21 builds the profile menu.
export async function signOut(page: Page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
}
