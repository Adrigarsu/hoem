import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// NFR-A11Y-001: WCAG 2.2 level AA, which includes the 2.0 and 2.1 A and AA rules.
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

// Checks the page in each theme, then restores the theme, so later steps of the test run in the
// default theme.
export async function expectNoA11yViolations(page: Page) {
  // After a client navigation Next.js sets the new <title> a moment later; axe checks the page
  // once it has settled, and a page without a title still fails here.
  await expect(page, "the page has a <title>").toHaveTitle(/\S/);
  const chosenTheme = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  await turnTransitionsOff(page);
  for (const theme of ["light", "dark"] as const) {
    // The system preference picks the theme; data-theme (the user's choice, #22) overrides it,
    // so both are set. Reduced motion shortens the animations that are left.
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await setThemeAttribute(page, theme);
    await nextPaint(page);
    // TEMP #81: remove before /ship.
    await logColourDiagnostics(page, "before", []);
    const { violations } = await analyzeWithoutStickyOverlap(page);
    // TEMP #81: remove before /ship.
    await logColourDiagnostics(page, "after", violations);
    expect(violations, `axe violations in the ${theme} theme`).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: null, reducedMotion: null });
  await setThemeAttribute(page, chosenTheme);
}

// A theme switch starts colour transitions that outlast the wait for the next paint, even with
// reduced motion: globals.css shortens every transition but leaves transition-property at `all`.
// Inherited colours change level by level, so axe could read the old theme's text colour on the
// new theme's background and report contrast that nobody sees (#81). The style stays until the next
// full page load: removing it made WebKit stall later clicks and form submissions.
async function turnTransitionsOff(page: Page) {
  await page.evaluate(() => {
    const id = "axe-no-transitions";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = "*, ::before, ::after { transition-property: none !important; }";
    document.head.append(style);
  });
}

// TEMP #81: remove before /ship. Prints only when a transition is running or axe has failed.
async function logColourDiagnostics(
  page: Page,
  moment: "before" | "after",
  violations: { id: string; nodes: { target: unknown[] }[] }[],
) {
  const selectors = violations.flatMap(({ nodes }) => nodes.map(({ target }) => String(target[0])));
  const snapshot = await page.evaluate(
    (nodeSelectors) => ({
      theme: document.documentElement.dataset.theme,
      running: document.getAnimations().length,
      kinds: [
        ...new Set(
          document
            .getAnimations()
            .map((animation) =>
              animation instanceof CSSTransition ? animation.transitionProperty : "animation",
            ),
        ),
      ].slice(0, 10),
      nodes: nodeSelectors.map((selector) => {
        const node = document.querySelector(selector);
        return node && { selector, color: getComputedStyle(node).color };
      }),
    }),
    selectors,
  );
  if (snapshot.running === 0 && violations.length === 0) return;
  console.log(`[#81] ${moment} ${page.url()} ${JSON.stringify(snapshot)}`);
}

// axe does not scroll, so it reports a link that happens to end under the sticky tab bar at the top
// of a long page, which depends on the window height and is one scroll away from usable. Sticky
// elements stay in the check, in the flow, so every target is measured at its real size.
async function analyzeWithoutStickyOverlap(page: Page) {
  const mark = "data-axe-unstuck";
  await page.evaluate((attribute) => {
    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      if (getComputedStyle(element).position !== "sticky") continue;
      element.setAttribute(attribute, "");
      element.style.position = "static";
    }
  }, mark);
  try {
    return await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  } finally {
    await page.evaluate((attribute) => {
      for (const element of document.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
        element.removeAttribute(attribute);
        element.style.position = "";
      }
    }, mark);
  }
}

// Two animation frames: the theme change has been styled and painted, which is what a person
// sees.
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
