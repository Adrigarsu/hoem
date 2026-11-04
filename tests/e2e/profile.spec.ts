import { request as playwrightRequest, type Page } from "@playwright/test";
import sharp from "sharp";
import { expectNoA11yViolations, expectNoHorizontalScroll } from "./support/accessibility";
import { verifiedAccount } from "./support/accounts";
import { accessTokenOf, avatarPathOf } from "./support/database";
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

// Every avatar on screen, not only the card's: the header button on phones, the sidebar from 768 px.
const shownPhotos = (page: Page) => page.locator("img:visible");
const removeButton = (page: Page) =>
  page.getByRole("button", { name: "Remove photo" }).locator("visible=true");

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
    await other.getByLabel("Email", { exact: true }).fill(email);
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

  test("FR-ACC-007 removing my photo shows my initials everywhere at once, and Undo brings it back", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const photoUrl = (await avatarPhoto(page).getAttribute("src")) ?? "";

    await removeButton(page).click();
    await expect(shownPhotos(page)).toHaveCount(0);
    await expect(page.getByText("Photo removed")).toBeVisible();
    await expect(page.getByLabel("Change photo")).toBeFocused();

    // Pointer on the toast pauses the countdown, so the checks below cannot outlast it.
    await page.getByText("Photo removed").hover();
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(avatarPhoto(page)).toBeVisible();
    await expect(page.getByText("Photo removed")).toHaveCount(0);
    expect((await page.request.get(photoUrl)).ok()).toBe(true);
  });

  test("FR-ACC-007 a removed photo is deleted for real once the 5 seconds have passed", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const photoUrl = (await avatarPhoto(page).getAttribute("src")) ?? "";

    await removeButton(page).click();
    await page.mouse.move(0, 0);
    await expect(page.getByText("Photo removed")).toHaveCount(0, { timeout: 10_000 });

    // Its signed URL is still within its 15 minutes, so only a deleted file can make it fail.
    await expect.poll(async () => (await page.request.get(photoUrl)).ok()).toBe(false);
    await visit(accountPage(page));
    await expect(shownPhotos(page)).toHaveCount(0);
    await expect(removeButton(page)).toHaveCount(0);
  });

  test("NFR-UX-002 a removed photo is deleted even when the page is left within the 5 seconds", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const photoUrl = (await avatarPhoto(page).getAttribute("src")) ?? "";

    await removeButton(page).click();
    await expect(page.getByText("Photo removed")).toBeVisible();
    // A full navigation unloads the page (pagehide); only a keepalive request survives it.
    await page.goto("about:blank");

    await expect.poll(() => avatarPathOf(email, password)).toBeNull();
    await expect.poll(async () => (await page.request.get(photoUrl)).ok()).toBe(false);
  });

  test("FR-ACC-007 an API client removes its photo with a Bearer token", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);

    const token = await accessTokenOf(email, password);
    // A fresh request context: no session cookie, only the token.
    const api = await playwrightRequest.newContext();
    const response = await api.delete(new URL("/api/v1/profile/avatar", page.url()).href, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(204);
    await api.dispose();
    expect(await avatarPathOf(email, password)).toBeNull();
  });

  test("NFR-SEC-001 the API refuses a Bearer token that is not a user's", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const api = await playwrightRequest.newContext();
    const response = await api.delete(new URL("/api/v1/profile/avatar", page.url()).href, {
      headers: { authorization: "Bearer not-a-token" },
    });
    expect(response.status()).toBe(401);
    expect(response.headers()["www-authenticate"]).toBe("Bearer");
    await api.dispose();
    expect(await avatarPathOf(email, password)).not.toBeNull();
  });

  test("NFR-SEC-006 the API refuses a cookie request from another origin", async ({
    page,
    visit,
  }) => {
    await visit(accountPage(page));
    await uploadPhoto(page);
    const response = await page.request.delete("/api/v1/profile/avatar", {
      headers: { origin: "https://evil.example" },
    });
    expect(response.status()).toBe(403);
    expect(response.headers()["content-type"]).toBe("application/problem+json");
    expect(await avatarPathOf(email, password)).not.toBeNull();
  });
});
