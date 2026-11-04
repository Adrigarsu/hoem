import type { Page } from "@playwright/test";

// Sign out is the last entry of the profile and settings menu (FR-NAV-003).
export async function signOut(page: Page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
}

// Scoped to the form: during the client-side navigation after signing out, Account settings, which
// has an Email field too, is briefly still there.
export async function signIn(page: Page, email: string, password: string) {
  const form = page.getByRole("form", { name: "Sign in" });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Password", { exact: true }).fill(password);
  await form.getByRole("button", { name: "Sign in" }).click();
}
