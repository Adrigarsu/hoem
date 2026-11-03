import { expect, test } from "./support/fixtures";

test("NFR-A11Y-006 a theme change starts no transitions under reduced motion", async ({
  page,
  visit,
}) => {
  await visit("/sign-up");
  await page.emulateMedia({ reducedMotion: "reduce" });

  const transitions = await page.evaluate(async () => {
    document.documentElement.dataset.theme = "dark";
    await new Promise(requestAnimationFrame);
    return document.getAnimations().filter((animation) => animation instanceof CSSTransition)
      .length;
  });

  expect(transitions).toBe(0);
});
