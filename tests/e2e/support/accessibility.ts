import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// NFR-A11Y-001: WCAG 2.2 level AA, which includes the 2.0 and 2.1 A and AA rules.
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

// Checks the page in each theme, then leaves it as it was, so later steps of the test run in the
// default theme.
export async function expectNoA11yViolations(page: Page) {
  const chosenTheme = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  for (const theme of ["light", "dark"] as const) {
    // The system preference picks the theme; data-theme (the user's choice, #22) overrides it,
    // so both are set. Reduced motion makes colour transitions instant, so axe never reads a
    // colour halfway through the switch.
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await setThemeAttribute(page, theme);
    await nextPaint(page);
    const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(violations, `axe violations in the ${theme} theme`).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: null, reducedMotion: null });
  await setThemeAttribute(page, chosenTheme);
}

// Two animation frames: the theme change has been styled and painted, which is what a person
// sees. WebKit on Linux can still report the old inherited text colour of freshly rendered
// elements in the same frame as the change, which made axe report contrast that nobody sees.
async function nextPaint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function setThemeAttribute(page: Page, theme: string | null) {
  await page.evaluate((value) => {
    if (value === null) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
  }, theme);
}

// NFR-UX-001: the layout fits the viewport.
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);
}
