import type { Page } from "@playwright/test";
import { expect } from "./fixtures";
import { emailLink, uniqueEmail } from "./mailbox";

// Signs up as Lucía, opens the verification link and lands in the app. Returns the new address.
export async function verifiedAccount(
  page: Page,
  visit: (path: string) => Promise<void>,
  prefix: string,
  password: string,
) {
  const email = uniqueEmail(prefix);
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
