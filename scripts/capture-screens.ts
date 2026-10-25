// Saves a full-page screenshot of every reference screen in docs/design-system/screens/, to compare
// a pull request against the design without keeping images in the repository.
//   pnpm screens:capture            every screen
//   pnpm screens:capture sign-in    only the screens whose name contains "sign-in"
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const screensDir = resolve("docs/design-system/screens");
const outputDir = resolve("screenshots");
const filter = process.argv[2] ?? "";

async function main() {
  const screens = readdirSync(screensDir)
    .filter((file) => file.endsWith(".html") && file.includes(filter))
    .map((file) => file.replace(/\.html$/, ""));

  const browser = await chromium.launch();
  // Each file is a board with every frame (light, dark, mobile, desktop, states) side by side.
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  for (const screen of screens) {
    await page.goto(pathToFileURL(join(screensDir, `${screen}.html`)).href, { waitUntil: "load" });
    await page.screenshot({ path: join(outputDir, `${screen}.png`), fullPage: true });
    process.stdout.write(`screenshots/${screen}.png\n`);
  }

  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
