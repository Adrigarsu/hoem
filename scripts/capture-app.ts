// Saves one collage per page of the running app (360, 768 and 1440 px, light and dark) into the
// ignored screenshots/ folder, for pull requests that change the UI.
//   pnpm app:capture sign-in sign-up               signed-out pages
//   pnpm app:capture --signed-in home settings     signs up and verifies a fresh account first
// Paths go without the leading slash ("home" is /), because Git Bash turns /sign-in into a
// Windows path before the script sees it.
// Needs the app running (APP_URL, default http://localhost:3000) and, for --signed-in, the local
// Supabase with Mailpit (pnpm db:start).
import { chromium, type Browser, type BrowserContextOptions } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { emailLink, uniqueEmail } from "../tests/e2e/support/mailbox";

const baseURL = process.env.APP_URL ?? "http://localhost:3000";
const outputDir = resolve("screenshots");
const widths = [360, 768, 1440] as const;
const themes = ["light", "dark"] as const;
const password = "correct horse battery";

type StorageState = BrowserContextOptions["storageState"];

async function signUpVerified(browser: Browser): Promise<StorageState> {
  const email = uniqueEmail("capture");
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Lucía");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Repeat the password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/check-your-inbox$/);
  await page.goto((await emailLink(email)).link);
  await page.waitForURL(/\/$/);
  const state = await context.storageState();
  await context.close();
  return state;
}

async function capture(browser: Browser, path: string, storageState: StorageState) {
  const shots: Record<string, string> = {};
  for (const theme of themes) {
    for (const width of widths) {
      const context = await browser.newContext({
        baseURL,
        storageState,
        colorScheme: theme,
        viewport: { width, height: width === 360 ? 800 : 900 },
      });
      const page = await context.newPage();
      await page.goto(path, { waitUntil: "networkidle" });
      // The dev server's Next.js badge is not part of the page.
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      shots[`${width}-${theme}`] = (await page.screenshot({ fullPage: true })).toString("base64");
      await context.close();
    }
  }
  return shots;
}

async function saveCollage(browser: Browser, path: string, shots: Record<string, string>) {
  const cell = (width: number, theme: string) =>
    `<figure><figcaption>${width} px · ${theme}</figcaption>` +
    `<img src="data:image/png;base64,${shots[`${width}-${theme}`]}" style="width:${width}px"></figure>`;
  const row = (theme: string) =>
    `<div class="row">${widths.map((width) => cell(width, theme)).join("")}</div>`;
  const slug = path.replace(/^\/+|\/+$/g, "").replace(/[^\w-]+/g, "_") || "home";
  const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
  await page.setContent(`<html><body>
    <style>
      body { margin: 0; padding: 32px; background: #e9e6e1; font: 600 20px system-ui; width: max-content; }
      .row { display: flex; gap: 32px; align-items: flex-start; margin-top: 24px; }
      figure { margin: 0; } figcaption { margin-bottom: 8px; color: #333; }
      img { display: block; border: 1px solid #c9c5bf; }
    </style>
    <h1 style="margin: 0; font-size: 32px">${slug} · app (Chromium)</h1>${themes.map(row).join("")}
  </body></html>`);
  const file = join(outputDir, `app-${slug}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  process.stdout.write(`screenshots/app-${slug}.png\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const signedIn = args.includes("--signed-in");
  const paths = args
    .filter((arg) => arg !== "--signed-in")
    .map((arg) => (arg === "home" ? "/" : `/${arg.replace(/^\/+/, "")}`));
  if (paths.length === 0) throw new Error("Pass at least one path, for example sign-in");

  mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const storageState = signedIn ? await signUpVerified(browser) : undefined;
  for (const path of paths) {
    await saveCollage(browser, path, await capture(browser, path, storageState));
  }
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
