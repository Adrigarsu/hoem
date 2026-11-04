import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/accessibility";
import { verifiedAccount } from "./support/accounts";
import { otherDevice } from "./support/database";
import { expect, test } from "./support/fixtures";
import { emailLink, uniqueEmail } from "./support/mailbox";
import { signIn, signOut } from "./support/session";

const password = "correct horse battery";
const newPassword = "staple orange window";

// Phones edit on a page of their own; wider screens in the cards of /settings.
const accountPage = (page: Page) =>
  (page.viewportSize()?.width ?? 0) < 768 ? "/settings/account" : "/settings";

const emailField = (page: Page) => page.getByRole("textbox", { name: "Email" });

// The link path, so it opens on the app under test whatever origin the e-mail names.
const pathOf = (link: string) => new URL(link).pathname + new URL(link).search;

test.describe("FR-ACC-007 change my e-mail and password", () => {
  let email = "";

  test.beforeEach(async ({ page, visit }) => {
    email = await verifiedAccount(page, visit, "credentials", password);
  });

  test("FR-ACC-007 a new e-mail changes only once its link is opened", async ({ page, visit }) => {
    test.slow();
    const newEmail = uniqueEmail("credentials-new");
    await visit(accountPage(page));
    await emailField(page).fill(newEmail);
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(
      page.getByText(`We sent a link to ${newEmail}. Your email changes once you open it.`),
    ).toBeVisible();

    await page.reload();
    await expect(emailField(page)).toHaveValue(email);
    await expect(page.getByText(`Waiting for you to confirm ${newEmail}.`)).toBeVisible();
    await expectNoA11yViolations(page);

    const { subject, link } = await emailLink(newEmail);
    expect(subject).toBe("Confirm your new e-mail for HØEM");
    await page.goto(pathOf(link));
    await expect(page).toHaveURL(/\/settings\/account$/);
    await expect(emailField(page)).toHaveValue(newEmail);

    // A link works once: opened again, Account settings explains it rather than sign-in.
    await page.goto(pathOf(link));
    await expect(page).toHaveURL(/\/settings\/account\?error=/);
    await expect(
      page.getByRole("main").getByRole("alert").filter({ hasText: "was already used" }),
    ).toBeVisible();
  });

  test("FR-ACC-007 an e-mail confirmed on another device shows without signing in again", async ({
    page,
    browser,
    visit,
  }) => {
    test.slow();
    const newEmail = uniqueEmail("credentials-other");
    await visit(accountPage(page));
    await emailField(page).fill(newEmail);
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText(`We sent a link to ${newEmail}.`)).toBeVisible();

    const { link } = await emailLink(newEmail);
    const phone = await browser.newPage();
    await phone.goto(new URL(pathOf(link), page.url()).toString());
    await expect(phone).toHaveURL(/\/settings\/account$/);
    await phone.close();

    await page.reload();
    await expect(emailField(page)).toHaveValue(newEmail);
  });

  test("FR-ACC-007 changing my password asks for the current one and signs out my other devices", async ({
    page,
    browser,
    visit,
  }) => {
    test.slow();
    const laptop = await otherDevice(email, password);
    const tablet = await browser.newPage();
    await tablet.goto(new URL("/sign-in", page.url()).toString());
    await signIn(tablet, email, password);
    await expect(tablet).toHaveURL(/\/$/);
    await visit(accountPage(page));
    await page.getByRole("link", { name: "Change password" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Change password" })).toBeVisible();
    await visit("/settings/password");

    await page.getByLabel("Current password").fill("not my password");
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Repeat the password").fill(newPassword);
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page.getByLabel("Current password")).toBeFocused({ timeout: 15_000 });
    await expect(page.getByText("Your current password is incorrect.")).toBeVisible();
    expect(await laptop.signedIn()).toBe(true);

    await page.getByLabel("Current password").fill(password);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Repeat the password").fill(newPassword);
    await page.getByRole("button", { name: "Save password" }).click();
    // Checking the current password, saving the new one and signing out the other sessions: three
    // calls to Supabase, slower than the default wait while every browser project runs at once.
    await expect(page.getByText("Password saved. Your other devices were signed out.")).toBeVisible(
      { timeout: 15_000 },
    );
    expect(await laptop.signedIn()).toBe(false);
    // Its token is still valid, but settings ask Supabase, which sends it to sign in again.
    await tablet.goto(new URL("/settings", page.url()).toString());
    await expect(tablet).toHaveURL(/\/sign-in$/);
    await tablet.close();

    await signOut(page);
    await expect(page).toHaveURL(/\/sign-in$/);
    await signIn(page, email, password);
    await expect(
      page.getByRole("alert").filter({ hasText: "Email or password is incorrect." }),
    ).toBeVisible();
    await signIn(page, email, newPassword);
    await expect(page).toHaveURL(/\/$/);
  });
});
