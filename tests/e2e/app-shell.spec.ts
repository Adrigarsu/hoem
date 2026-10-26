import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import { emailLink, uniqueEmail } from "./support/mailbox";

const password = "correct horse battery";
const tabBarOrder = ["Shopping", "Expenses", "Home", "Planner", "Meals"];
const sidebarOrder = ["Home", "Planner", "Meals", "Shopping", "Expenses"];

// One verified account per worker: the shell tests only need someone signed in.
let email = "";

test.beforeAll(async ({ browser }, testInfo) => {
  email = uniqueEmail("shell");
  const page = await browser.newPage({ baseURL: testInfo.project.use.baseURL });
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Lucía");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Repeat the password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/check-your-inbox$/);
  await page.goto((await emailLink(email)).link);
  await expect(page).toHaveURL(/\/$/);
  await page.close();
});

test.beforeEach(async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
});

function isPhone(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 768;
}

// Safari moves through links only with Option+Tab or its "Press Tab to highlight each item"
// setting, and Playwright's WebKit offers neither, so the link order is checked in Chromium and
// Chrome.
const webkitSkipsLinks = "WebKit in Playwright does not move keyboard focus to links";

function mainNavigation(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

test.describe("FR-NAV-001 app navigation", () => {
  test("FR-NAV-001 phones get a bottom tab bar with Home in the centre and the avatar at the top right", async ({
    page,
    visit,
  }) => {
    test.skip(!isPhone(page), "The tab bar is for phones");
    await visit("/");

    await expect(mainNavigation(page).getByRole("link")).toHaveText(tabBarOrder);
    const viewport = page.viewportSize();
    const tabBar = await mainNavigation(page).boundingBox();
    expect(tabBar && viewport && tabBar.y + tabBar.height).toBe(viewport?.height);

    const avatar = await page.getByRole("link", { name: "Profile and settings" }).boundingBox();
    expect(avatar && viewport && viewport.width - (avatar.x + avatar.width)).toBeLessThan(24);
    expect(avatar?.y).toBeLessThan(24);
  });

  test("FR-NAV-001 wider screens get a sidebar with the profile entry at the bottom", async ({
    page,
    visit,
  }) => {
    test.skip(isPhone(page), "The sidebar is for wider screens");
    await visit("/");

    await expect(mainNavigation(page).getByRole("link")).toHaveText(sidebarOrder);
    const navigation = await mainNavigation(page).boundingBox();
    const profile = await page
      .getByRole("link", { name: "Lucía Profile and settings" })
      .boundingBox();
    expect(profile && navigation && profile.y > navigation.y + navigation.height).toBe(true);
  });

  test("FR-NAV-001 the current destination is announced and marked by more than colour", async ({
    page,
    visit,
  }) => {
    await visit("/meals");

    const meals = mainNavigation(page).getByRole("link", { name: "Meals" });
    const shopping = mainNavigation(page).getByRole("link", { name: "Shopping" });
    await expect(meals).toHaveAttribute("aria-current", "page");
    await expect(shopping).not.toHaveAttribute("aria-current");
    // A bolder label, besides the tint.
    await expect(meals).toHaveCSS("font-weight", "700");
    await expect(shopping).not.toHaveCSS("font-weight", "700");
  });

  test("NFR-A11Y-004 an icon-only button has a name and shows a tooltip on hover and focus", async ({
    page,
  }) => {
    const bell = page.getByRole("link", { name: "Notifications" });
    const tooltip = page.getByText("Notifications", { exact: true });

    await bell.hover();
    await expect(tooltip).toBeVisible();
    // WCAG 1.4.13: the pointer can move onto the tooltip without closing it.
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();

    await bell.focus();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
  });

  test("FR-NAV-001 the keyboard reaches every destination in order with a visible focus", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", webkitSkipsLinks);
    // A fresh load: after the client navigation from sign-in, focus is not at the top of the page.
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeVisible();

    const reached: string[] = [];
    for (let step = 0; step < 20; step += 1) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        return {
          inNavigation: Boolean(element?.closest('nav[aria-label="Main"]')),
          name: element?.textContent?.trim() ?? "",
          // Past the last control, focus leaves the page for the browser and lands on <body>.
          visibleFocus:
            element === document.body ||
            (element !== null && getComputedStyle(element).outlineStyle !== "none"),
        };
      });
      expect(focused.visibleFocus).toBe(true);
      if (focused.inNavigation) reached.push(focused.name);
    }

    expect(reached.slice(0, 5)).toEqual(isPhone(page) ? tabBarOrder : sidebarOrder);
  });

  test("FR-NAV-001 the skip link moves focus past the navigation to the content", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", webkitSkipsLinks);
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
});

test.describe("FR-NAV-002 Home is the hub", () => {
  test("FR-NAV-002 every module, the notes and the notifications are one tap away", async ({
    page,
    visit,
  }) => {
    await visit("/");
    const content = page.getByRole("main");

    await expect(
      page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening), Lucía$/ }),
    ).toBeVisible();
    await expect(content.getByRole("link", { name: /^Meals/ })).toHaveAttribute("href", "/meals");
    await expect(content.getByRole("link", { name: /^Shopping/ })).toHaveAttribute(
      "href",
      "/shopping",
    );
    await expect(content.getByRole("link", { name: /^Expenses/ })).toHaveAttribute(
      "href",
      "/expenses",
    );
    await expect(content.getByRole("link", { name: "Open planner" })).toHaveAttribute(
      "href",
      "/planner",
    );
    await expect(content.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  test("FR-NAV-002 a module that is not built yet says it is coming soon", async ({
    page,
    visit,
  }) => {
    await visit("/expenses");

    await expect(page.getByRole("heading", { level: 1, name: "Expenses" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Coming soon" })).toBeVisible();
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("FR-NAV-002 the notifications and settings pages fit and pass axe", async ({
    page,
    visit,
  }) => {
    await visit("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: "Notifications" })).toBeVisible();

    await visit("/settings");
    await expect(
      page.getByRole("heading", { level: 1, name: "Profile and settings" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
