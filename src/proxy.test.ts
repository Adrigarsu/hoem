// @vitest-environment node
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "https://hoemapp.com"), { headers });
}

function rewrittenPath(response: Response): string | null {
  const target = response.headers.get("x-middleware-rewrite");
  return target ? new URL(target).pathname + new URL(target).search : null;
}

describe("proxy", () => {
  it("NFR-I18N-001 serves the page in the locale from Accept-Language without a locale in the URL", () => {
    expect(rewrittenPath(proxy(request("/shopping", { "accept-language": "en-GB" })))).toBe(
      "/en/shopping",
    );
  });

  it("NFR-I18N-001 uses the locale cookie set from the profile before Accept-Language", () => {
    const response = proxy(request("/", { cookie: "hoem-locale=en", "accept-language": "fr" }));
    expect(rewrittenPath(response)).toBe("/en");
  });

  it("NFR-I18N-001 falls back to English without a cookie or header", () => {
    expect(rewrittenPath(proxy(request("/planner")))).toBe("/en/planner");
  });

  it("NFR-I18N-001 keeps the query string when it rewrites", () => {
    expect(rewrittenPath(proxy(request("/expenses?month=2026-10")))).toBe(
      "/en/expenses?month=2026-10",
    );
  });

  it("NFR-I18N-001 redirects a URL that names a locale to the same page without it", () => {
    const response = proxy(request("/en/shopping?list=1"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://hoemapp.com/shopping?list=1");
  });

  it("NFR-I18N-001 redirects the bare locale path to the home page", () => {
    expect(proxy(request("/en")).headers.get("location")).toBe("https://hoemapp.com/");
  });

  it.each([
    "/",
    "/shopping",
    "/en/shopping",
    "/households/0192f3a4/expenses",
    "/households/0192f3a4/notes/v1.2",
  ])("NFR-I18N-001 runs for the page %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });

  it.each([
    "/api",
    "/api/v1/households",
    "/_next/static/chunk.js",
    "/icon.svg",
    "/robots.txt",
    "/fonts/plus-jakarta.woff2",
  ])("NFR-I18N-001 leaves %s alone", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });
});
