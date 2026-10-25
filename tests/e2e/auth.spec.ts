import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/accessibility";
import { expect, test } from "./support/fixtures";
import { uniqueEmail, verificationEmail } from "./support/mailbox";

const password = "correct horse battery";

async function signUp(page: Page, visit: (path: string) => Promise<void>, email: string) {
  await visit("/sign-up");
  await page.getByLabel("Your name").fill("Ana");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Repeat the password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
}

// Next.js renders an empty role=alert route announcer on every page, so match by text.
function alert(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function signIn(page: Page, email: string, withPassword = password) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(withPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("FR-ACC-001 e-mail sign-up and sign-in", () => {
  test("FR-ACC-001 sign up sends a verification e-mail", async ({ page, visit }) => {
    const email = uniqueEmail("signup");
    await signUp(page, visit, email);
    await expect(page.getByText(email)).toBeVisible();
    await expectNoA11yViolations(page);

    const { subject, link } = await verificationEmail(email);
    expect(subject).toBe("Verify your e-mail for HØEM");
    expect(link).toContain("/auth/confirm?token_hash=");
  });

  test("FR-ACC-001 verifying the e-mail signs me in and lands on Home", async ({ page, visit }) => {
    const email = uniqueEmail("verify");
    await signUp(page, visit, email);
    const { link } = await verificationEmail(email);

    await page.goto(link);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "HØEM" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("NFR-SEC-004 the session cookies are HttpOnly and SameSite=Lax", async ({ page, visit }) => {
    const email = uniqueEmail("cookies");
    await signUp(page, visit, email);

    // The Set-Cookie headers as the server sends them, read without a browser engine:
    // Playwright's WebKit on Windows and Linux reports every cookie as SameSite=None and hides
    // the headers of redirects.
    const response = await page.request.get((await verificationEmail(email)).link, {
      maxRedirects: 0,
    });
    const session = response
      .headersArray()
      .filter(({ name, value }) => name.toLowerCase() === "set-cookie" && value.startsWith("sb-"))
      .map(({ value }) => value);

    expect(session).not.toEqual([]);
    expect(session).toEqual(session.map(() => expect.stringMatching(/;\s*HttpOnly/i)));
    expect(session).toEqual(session.map(() => expect.stringMatching(/;\s*SameSite=Lax/i)));
  });

  test("FR-ACC-001 an unverified account cannot sign in and can ask for a new link", async ({
    page,
    visit,
  }) => {
    const email = uniqueEmail("unverified");
    await signUp(page, visit, email);
    await verificationEmail(email);

    await visit("/sign-in");
    await signIn(page, email);

    await expect(alert(page, "Verify your e-mail first")).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("button", { name: "Send the link again" }).click();
    await expect(page.getByRole("status").filter({ hasText: "We sent a new link." })).toBeVisible();
    await verificationEmail(email, 2);
  });

  test("FR-ACC-001 wrong credentials do not reveal which part is wrong", async ({
    page,
    visit,
  }) => {
    await visit("/sign-in");
    await signIn(page, uniqueEmail("nobody"), "not the password");
    await expect(alert(page, "E-mail or password is incorrect.")).toBeVisible();
  });

  test("FR-ACC-001 the app is protected and sign-in returns to the page asked for", async ({
    page,
    visit,
  }) => {
    const email = uniqueEmail("return");
    await signUp(page, visit, email);
    await page.goto((await verificationEmail(email)).link);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.goto("/planner?week=2026-W44");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fplanner%3Fweek%3D2026-W44$/);
    await signIn(page, email);
    await expect(page).toHaveURL(/\/planner\?week=2026-W44$/);
  });

  test("FR-ACC-001 signing out ends the session", async ({ page, visit }) => {
    const email = uniqueEmail("signout");
    await signUp(page, visit, email);
    await page.goto((await verificationEmail(email)).link);
    await expectNoA11yViolations(page);

    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
