import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/accessibility";
import { expect, test } from "./support/fixtures";
import { uniqueEmail, verificationEmail } from "./support/mailbox";

const password = "correct horse battery";

async function signUp(page: Page, visit: (path: string) => Promise<void>, email: string) {
  await visit("/sign-up");
  await page.getByLabel("Your name").fill("Ana");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Repeat the password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/check-your-inbox$/);
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
}

// Next.js renders an empty role=alert route announcer on every page, so match by text.
function alert(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function signIn(page: Page, email: string, withPassword = password) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(withPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("FR-ACC-001 e-mail sign-up and sign-in", () => {
  test("FR-ACC-001 sign up sends a verification e-mail", async ({ page, visit }) => {
    const email = uniqueEmail("signup");
    await signUp(page, visit, email);
    await expect(page.getByText(email, { exact: true })).toBeVisible();
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

    await expect(
      alert(page, `Confirm your email first. We sent a link to ${email}.`),
    ).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("button", { name: "Resend the link" }).click();
    await expect(page).toHaveURL(/\/check-your-inbox$/);
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await verificationEmail(email, 2);
  });

  test("FR-ACC-001 wrong credentials do not reveal which part is wrong", async ({
    page,
    visit,
  }) => {
    await visit("/sign-in");
    await signIn(page, uniqueEmail("nobody"), "not the password");
    await expect(alert(page, "Email or password is incorrect.")).toBeVisible();
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

  test("FR-ACC-001 check your inbox resends the link and then waits a minute", async ({
    page,
    visit,
  }) => {
    const email = uniqueEmail("resend");
    await signUp(page, visit, email);
    await verificationEmail(email);

    const resend = page.getByRole("button", { name: "Resend email" });
    const sent = page.getByRole("status").filter({ hasText: "We sent a new link." });
    // From the keyboard, which also proves focus stays on the button. Supabase refuses a second
    // e-mail within a second of the first (max_frequency), so press again until it is accepted.
    await expect(async () => {
      await resend.focus();
      await page.keyboard.press("Enter");
      await expect(sent).toBeVisible({ timeout: 2000 });
    }).toPass();
    await expect(resend).toHaveAttribute("aria-disabled", "true");
    await expect(resend).toHaveAccessibleDescription(/You can ask for another link in \d+ s\./);
    await expect(resend).toBeFocused();
    await expectNoA11yViolations(page);
    await verificationEmail(email, 2);
  });

  test("FR-ACC-001 the address stays out of the URL and a different one can be used", async ({
    page,
    visit,
  }) => {
    const email = uniqueEmail("different");
    await signUp(page, visit, email);
    expect(page.url()).not.toContain(encodeURIComponent(email));

    await page.getByRole("link", { name: "Use a different email" }).click();

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByLabel("Your name")).toHaveValue("Ana");
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  });

  test("FR-ACC-001 check your inbox without a sign-up goes to sign-in", async ({ page }) => {
    await page.goto("/check-your-inbox");
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
