import type { Page } from "@playwright/test";

// Sign out is the last entry of the profile and settings menu (FR-NAV-003).
export async function signOut(page: Page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
}
