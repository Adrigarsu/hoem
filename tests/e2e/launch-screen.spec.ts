import type { Page, Request } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import { expectNoA11yViolations } from "./support/accessibility";
import { emailLink, uniqueEmail } from "./support/mailbox";

const password = "correct horse battery";
let email = "";

test.beforeAll(async ({ browser }, testInfo) => {
  email = uniqueEmail("launch");
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

// A failed check must not leave the Planner's answer held, or the page would hang on closing.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

// Opens the Planner from Home while its content is still on its way. The route tree is
// prefetched, so the router knows the loading boundary; the prefetch of the content fails, so the
// navigation has to ask the server, which the test holds until it releases it.
async function openPlannerWhileItLoads(page: Page) {
  let release = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));
  const segment = (request: Request) => request.headers()["next-router-segment-prefetch"];
  const isPlannerContentPrefetch = (request: Request) =>
    new URL(request.url()).pathname === "/planner" && /__PAGE__$/.test(segment(request) ?? "");
  await page.route(
    (url) => url.pathname === "/planner",
    async (route) => {
      const request = route.request();
      if (isPlannerContentPrefetch(request)) return route.abort();
      if (request.headers().rsc && !segment(request)) await released;
      return route.continue();
    },
  );
  const contentPrefetchFailed = page.waitForEvent("requestfailed", isPlannerContentPrefetch);
  await page.goto("/");
  await contentPrefetchFailed;
  await page.getByRole("link", { name: "Open planner" }).click();
  return release;
}

function launchScreen(page: Page) {
  return page.locator('[aria-busy="true"]');
}

test.describe("FR-NAV-004 launch screen", () => {
  test("FR-NAV-004 shows the logo while the page loads, keeps the navigation and leaves as soon as it is ready", async ({
    page,
  }) => {
    const release = await openPlannerWhileItLoads(page);

    await expect(launchScreen(page).getByRole("img", { name: "HØEM" })).toBeVisible();
    await expect(launchScreen(page).getByRole("status")).toHaveText("Opening your home…");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expectNoA11yViolations(page);

    release();
    await expect(page.getByRole("heading", { level: 1, name: "Planner" })).toBeVisible();
    await expect(launchScreen(page)).toHaveCount(0);
    await expect(page).toHaveTitle(/^Planner/);
  });

  test("FR-NAV-004 shows no animation when the system asks for reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const release = await openPlannerWhileItLoads(page);

    const indicator = launchScreen(page).locator("[aria-hidden] > div");
    await expect(indicator).toHaveCSS("animation-name", "none");
    release();
  });
});
