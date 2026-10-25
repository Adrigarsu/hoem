import { test as base } from "@playwright/test";
import { expectNoA11yViolations, expectNoHorizontalScroll } from "./accessibility";

type Fixtures = {
  // Opens a page and checks it, so every visited page gets the accessibility and layout checks.
  visit: (path: string) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  visit: async ({ page }, use) => {
    await use(async (path) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
      await expectNoA11yViolations(page);
    });
  },
});

export { expect } from "@playwright/test";
