import type { Page } from "@playwright/test";
import sharp from "sharp";
import { verifiedAccount } from "./support/accounts";
import { expect, test } from "./support/fixtures";

const password = "correct horse battery";

function isPhone(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 768;
}

// Phones edit on a page of their own; wider screens in the cards of /settings.
const accountPage = (page: Page) => (isPhone(page) ? "/settings/account" : "/settings");
const appearancePage = (page: Page) => (isPhone(page) ? "/settings/appearance" : "/settings");
const languagePage = (page: Page) => (isPhone(page) ? "/settings/language" : "/settings");

async function pngPhoto() {
  return sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 51, g: 102, b: 153 } },
  })
    .png()
    .toBuffer();
}

const photoInput = (page: Page) => page.getByLabel("Change photo");

// The avatar's photo is decorative, so it has no role to find it by. /settings holds a block per
// width, and only one is on screen.
const avatarPhotos = (page: Page) => page.locator("main img:visible");
const avatarPhoto = (page: Page) => avatarPhotos(page).first();

// Next.js keeps a route announcer with the same role, outside the page content.
const pageAlert = (page: Page) => page.getByRole("main").getByRole("alert");

const dataTheme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);

async function uploadPhoto(page: Page) {
  await photoInput(page).setInputFiles({
    name: "me.png",
    mimeType: "image/png",
    buffer: await pngPhoto(),
  });
  await expect(page.getByText("Photo updated")).toBeVisible();
  await expect(avatarPhoto(page)).toBeVisible();
}

test.describe("FR-ACC-007 edit my profile", () => {
  let email = "";

  test.beforeEach(async ({ page, visit }) => {
    email = await verifiedAccount(page, visit, "profile", password);
  });

  test("FR-ACC-007 changing my name shows it in the app", async ({ page, visit }) => {
    await visit(accountPage(page));
    const name = page.getByRole("textbox", { name: "Name" });
    await expect(name).toHaveValue("Lucía");
    await name.fill("Lucía G.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Changes saved")).toBeVisible();

    await visit("/settings");
    if (isPhone(page)) {
      await expect(page.getByRole("region", { name: "Account" })).toContainText("Lucía G.");
    } else {
      await expect(
        page.getByRole("link", { name: /Lucía G\. Profile and settings/ }),
      ).toBeVisible();
    }
  });

  test("FR-ACC-007 an empty name is refused next to the field", async ({ page, visit }) => {
    await visit(accountPage(page));
    await page.getByRole("textbox", { name: "Name" }).fill("   ");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Enter your name")).toBeVisible();
  });

  test("FR-ACC-007 the email is shown and cannot be edited", async ({ page, visit }) => {
    await visit(accountPage(page));
    await expect(page.getByRole("main").getByText(email).locator("visible=true")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  });

  test("FR-ACC-007 an uploaded photo becomes my avatar, as a re-encoded WebP", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);

    const url = await avatarPhoto(page).getAttribute("src");
    expect(url).toContain("/object/sign/avatars/");
    const photo = await page.request.get(url ?? "");
    expect(photo.ok()).toBe(true);
    expect(photo.headers()["content-type"]).toBe("image/webp");

    await visit(accountPage(page));
    await expect(avatarPhoto(page)).toBeVisible();
  });

  test("FR-ACC-007 replacing my photo removes the previous file", async ({ page, visit }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const previous = (await avatarPhoto(page).getAttribute("src")) ?? "";
    expect((await page.request.get(previous)).ok()).toBe(true);

    await visit(accountPage(page));
    await photoInput(page).setInputFiles({
      name: "new.png",
      mimeType: "image/png",
      buffer: await pngPhoto(),
    });
    await expect(page.getByText("Photo updated")).toBeVisible();

    // Its signed URL is still within its 15 minutes, so only a deleted file can make it fail.
    expect((await page.request.get(previous)).ok()).toBe(false);
  });

  test("FR-ACC-007 the photo cannot be loaded without a signed URL", async ({
    page,
    visit,
    browser,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const signed = new URL((await avatarPhoto(page).getAttribute("src")) ?? "");
    const direct = `${signed.origin}${signed.pathname.replace("/object/sign/", "/object/")}`;
    const asPublic = direct.replace("/object/avatars/", "/object/public/avatars/");

    const stranger = await browser.newContext();
    expect((await stranger.request.get(direct)).ok()).toBe(false);
    expect((await stranger.request.get(asPublic)).ok()).toBe(false);
    await stranger.close();
  });

  test("FR-ACC-007 a 10 MB file is rejected with the reason and the avatar does not change", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await photoInput(page).setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(10 * 1024 * 1024),
    });
    await expect(pageAlert(page)).toContainText("too large");
    await expect(avatarPhotos(page)).toHaveCount(0);
  });

  test("FR-ACC-007 a PDF is rejected with the reason and the avatar does not change", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await photoInput(page).setInputFiles({
      name: "report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7 not an image"),
    });
    await expect(pageAlert(page)).toContainText("not a JPEG or PNG");
    await expect(avatarPhotos(page)).toHaveCount(0);
  });

  test("FR-ACC-007 the theme follows the system until I choose one", async ({ page, visit }) => {
    await visit(appearancePage(page));
    await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
    expect(await dataTheme(page)).toBeUndefined();
  });

  test("FR-ACC-007 a chosen theme stays after reloading and on another device", async ({
    page,
    visit,
    browser,
    baseURL,
  }) => {
    await visit(appearancePage(page));
    await page.getByText("Dark", { exact: true }).click();
    await expect(page.getByText("Changes saved")).toBeVisible();
    expect(await dataTheme(page)).toBe("dark");

    await page.reload();
    expect(await dataTheme(page)).toBe("dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();

    const otherDevice = await browser.newContext({ baseURL });
    const other = await otherDevice.newPage();
    await other.goto("/sign-in");
    await other.getByLabel("Email").fill(email);
    await other.getByLabel("Password", { exact: true }).fill(password);
    await other.getByRole("button", { name: "Sign in" }).click();
    await expect(other).toHaveURL(/\/$/);
    // Signing in is a client navigation, so the script in <head> does not run again: ThemeSync
    // applies the theme once the profile has loaded. The next full load has it from the cookie.
    await expect.poll(() => dataTheme(other)).toBe("dark");
    await other.reload();
    expect(await dataTheme(other)).toBe("dark");
    await otherDevice.close();
  });

  test("FR-ACC-007 English is selected and is the only language", async ({ page, visit }) => {
    await visit(languagePage(page));
    const language = page.getByRole("combobox", { name: "Language" });
    await expect(language).toHaveValue("en");
    await expect(language.getByRole("option")).toHaveText(["English"]);
  });
});
