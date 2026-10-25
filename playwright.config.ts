import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const isCI = Boolean(process.env.CI);

// NFR-UX-001: every test runs at 360, 768 and 1440 px. SRS 2.3 targets Chrome, Firefox, Safari
// and Edge; Firefox and Edge are not wired up yet. The 360 px projects emulate a phone (touch,
// mobile viewport and user agent); the wider ones are desktop windows.
const chromePhone = { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } };
const chromeDesktop = devices["Desktop Chrome"];
const safariPhone = { ...devices["iPhone 14"], viewport: { width: 360, height: 780 } };
const safariDesktop = devices["Desktop Safari"];

const tablet = { width: 768, height: 1024 };
const desktop = { width: 1440, height: 900 };

const browsers = {
  chromium: { phone: chromePhone, desktop: chromeDesktop },
  chrome: {
    phone: { ...chromePhone, channel: "chrome" },
    desktop: { ...chromeDesktop, channel: "chrome" },
  },
  safari: { phone: safariPhone, desktop: safariDesktop },
};

// WebKit runs these tests about three times slower than Chromium (axe in both themes on every
// page), so the longer sign-up flows reached the default 30 s even before #58.
const timeouts: Partial<Record<keyof typeof browsers, number>> = { safari: 60_000 };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: Object.entries(browsers).flatMap(([browser, { phone, desktop: wide }]) => {
    const timeout = timeouts[browser as keyof typeof browsers];
    return [
      { name: `${browser}-360`, timeout, use: phone },
      { name: `${browser}-768`, timeout, use: { ...wide, viewport: tablet } },
      { name: `${browser}-1440`, timeout, use: { ...wide, viewport: desktop } },
    ];
  }),
  // Always a fresh production build: CI builds it in an earlier step, locally it is built here.
  // Never reused, so a server left running from an earlier run cannot serve an old build.
  webServer: {
    command: isCI ? `pnpm start --port ${port}` : `pnpm build && pnpm start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
