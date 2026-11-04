import type { Page } from "@playwright/test";
import sharp from "sharp";
import { expectNoA11yViolations, expectNoHorizontalScroll } from "./support/accessibility";
import { verifiedAccount } from "./support/accounts";
import { expect, test } from "./support/fixtures";

const password = "correct horse battery";

// /settings holds one block per width, and a hidden block is out of the accessibility tree.
const deleteButton = (page: Page) => page.getByRole("button", { name: "Delete account" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Delete your account?" });
const field = (page: Page) => dialog(page).getByRole("textbox", { name: "Your email" });
const confirm = (page: Page) => dialog(page).getByRole("button", { name: "Delete my account" });

// Next.js keeps a route announcer with the same role, outside the page content.
const signInNotice = (page: Page) => page.getByRole("status").filter({ hasText: "deleted" });

async function openDialog(page: Page) {
  await deleteButton(page).click();
  await expect(dialog(page)).toBeVisible();
}

test.describe("FR-ACC-007 delete my account", () => {
  let email = "";

  test.beforeEach(async ({ page, visit }) => {
    email = await verifiedAccount(page, visit, "delete", password);
  });

  test("FR-ACC-007 typing my e-mail deletes the account and signs me out", async ({
    page,
    visit,
  }) => {
    await visit("/settings");
    await openDialog(page);
    await field(page).fill(email);
    await confirm(page).click();

    await expect(page).toHaveURL(/\/sign-in\?deleted=1$/);
    await expect(signInNotice(page)).toHaveText("Your account has been deleted.");
    await expect(signInNotice(page)).toBeFocused();

    // Without reloading: the dialog of the page before must not leave this one inert.
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    const emailField = page.getByRole("textbox", { name: "Email" });
    await emailField.click();
    await emailField.fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Email or password is incorrect." }),
    ).toBeVisible();

    await visit("/");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("FR-ACC-007 turning a phone keeps the dialog open and usable", async ({ page, visit }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "Only phones change layout by turning");
    await visit("/settings");
    await openDialog(page);
    await field(page).fill("someone@example.com");

    // The block that opened it is hidden now; the dialog lives outside both blocks.
    await page.setViewportSize({ width: 800, height: 360 });

    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toHaveValue("someone@example.com");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
  });

  test("FR-ACC-007 a wrong e-mail deletes nothing", async ({ page, visit }) => {
    await visit("/settings");
    await openDialog(page);
    await field(page).fill("someone@example.com");
    await confirm(page).click();

    await expect(dialog(page).getByText("That does not match")).toBeVisible();
    await page.keyboard.press("Escape");
    await visit("/settings");
    await expect(deleteButton(page)).toBeVisible();
  });

  test("FR-ACC-007 my photo is gone with the account", async ({ page, visit }) => {
    // Three checked pages and an upload.
    test.slow();
    const isPhone = (page.viewportSize()?.width ?? 0) < 768;
    await visit(isPhone ? "/settings/account" : "/settings");
    await page.getByLabel("Change photo").setInputFiles({
      name: "me.png",
      mimeType: "image/png",
      buffer: await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 51, g: 102, b: 153 } },
      })
        .png()
        .toBuffer(),
    });
    await expect(page.getByText("Photo updated")).toBeVisible();
    const photo = page.locator("main img:visible").first();
    await expect(photo).toBeVisible();
    const signedUrl = (await photo.getAttribute("src")) ?? "";
    expect((await page.request.get(signedUrl)).ok()).toBe(true);

    await visit("/settings");
    await openDialog(page);
    await field(page).fill(email);
    await confirm(page).click();
    await expect(page).toHaveURL(/\/sign-in\?deleted=1$/);

    // Its signed URL is still within its 15 minutes, so only a deleted file can make it fail.
    expect((await page.request.get(signedUrl)).ok()).toBe(false);
  });

  test("FR-ACC-007 the dialog works with the keyboard alone", async ({ page, visit }) => {
    await visit("/settings");
    await deleteButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(field(page)).toBeFocused();

    await page.keyboard.type("someone@example.com");
    await page.keyboard.press("Enter");
    await expect(dialog(page).getByText("That does not match")).toBeVisible();
    await expect(field(page)).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(deleteButton(page)).toBeFocused();
  });

  test("FR-ACC-007 the open dialog passes the accessibility checks", async ({ page, visit }) => {
    await visit("/settings");
    await openDialog(page);
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
  });
});
