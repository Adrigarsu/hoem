import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/accessibility";
import { expect, test } from "./support/fixtures";
import { signOut } from "./support/session";
import { emailLink, uniqueEmail } from "./support/mailbox";

const oldPassword = "correct horse battery";
const newPassword = "staple orange window";

// A verified account, signed out, ready to forget its password.
async function verifiedAccount(page: Page, visit: (path: string) => Promise<void>) {
  const email = uniqueEmail("reset");
  await visit("/sign-up");
  await page.getByLabel("Your name").fill("Ana");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByLabel("Repeat the password").fill(oldPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/check-your-inbox$/);
  await page.goto((await emailLink(email)).link);
  await signOut(page);
  await expect(page).toHaveURL(/\/sign-in$/);
  return email;
}

async function requestReset(page: Page, email: string) {
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  // Scoped to the form: during the client-side navigation the sign-in form is briefly still there.
  const form = page.getByRole("form", { name: "Reset your password" });
  await form.getByLabel("Email").fill(email);
  await form.getByRole("button", { name: "Send link" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Check your inbox" })).toBeFocused();
}

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("FR-ACC-008 password reset", () => {
  test("FR-ACC-008 a reset link lets me choose a new password and signs me in", async ({
    page,
    visit,
  }) => {
    // Two e-mails, two sign-outs through the settings page and axe on four pages.
    test.slow();
    const email = await verifiedAccount(page, visit);
    await requestReset(page, email);
    await expect(page.getByText(`If an account exists for ${email}`)).toBeVisible();
    await expectNoA11yViolations(page);

    const { subject, link } = await emailLink(email, 2);
    expect(subject).toBe("Reset your HØEM password");
    await visit(new URL(link).pathname + new URL(link).search);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Repeat the password").fill(newPassword);
    await page.getByRole("button", { name: "Save and sign in" }).click();

    // Saving checks the link, changes the password and signs out the other sessions: three calls to
    // Supabase, which take longer than the default wait while every browser project runs at once.
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await signOut(page);
    await signIn(page, email, oldPassword);
    await expect(
      page.getByRole("alert").filter({ hasText: "Email or password is incorrect." }),
    ).toBeVisible();
    await signIn(page, email, newPassword);
    await expect(page).toHaveURL(/\/$/);
  });

  test("FR-ACC-008 the answer is the same when no account exists", async ({ page, visit }) => {
    await visit("/sign-in");
    const email = uniqueEmail("nobody");
    await requestReset(page, email);
    await expect(page.getByText(`If an account exists for ${email}`)).toBeVisible();
  });

  test("FR-ACC-008 a used link says it no longer works and offers a new one", async ({
    page,
    visit,
  }) => {
    const email = await verifiedAccount(page, visit);
    await requestReset(page, email);
    const { link } = await emailLink(email, 2);
    const path = new URL(link).pathname + new URL(link).search;

    await page.goto(path);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Repeat the password").fill(newPassword);
    await page.getByRole("button", { name: "Save and sign in" }).click();
    // Saving checks the link, changes the password and signs out the other sessions: three calls to
    // Supabase, which take longer than the default wait while every browser project runs at once.
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await signOut(page);
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.goto(path);
    await page.getByLabel("New password", { exact: true }).fill("another passphrase");
    await page.getByLabel("Repeat the password").fill("another passphrase");
    await page.getByRole("button", { name: "Save and sign in" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "This link no longer works" }),
    ).toBeFocused();
    await expectNoA11yViolations(page);
    await page.getByRole("link", { name: "Ask for a new link" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "expired or was already used" }),
    ).toBeVisible();
  });

  test("FR-ACC-008 trying a different email shows the answer for the new address", async ({
    page,
    visit,
  }) => {
    await visit("/sign-in");
    const first = uniqueEmail("first");
    const second = uniqueEmail("second");
    await requestReset(page, first);

    await page.getByRole("button", { name: "Try a different email" }).click();
    const form = page.getByRole("form", { name: "Reset your password" });
    await form.getByLabel("Email").fill(second);
    await form.getByRole("button", { name: "Send link" }).click();

    await expect(page.getByText(`If an account exists for ${second}`)).toBeVisible();
    await expect(page.getByText(first)).toHaveCount(0);
  });
});
