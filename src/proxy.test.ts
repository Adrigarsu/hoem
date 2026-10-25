// @vitest-environment node
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, routeRequest } from "./proxy";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "https://hoemapp.com"), { headers });
}

const signedIn = { signedIn: true };
const signedOut = { signedIn: false };

function rewrittenPath(response: Response): string | null {
  const target = response.headers.get("x-middleware-rewrite");
  return target ? new URL(target).pathname + new URL(target).search : null;
}

describe("routeRequest", () => {
  it("NFR-I18N-001 serves the page in the locale from Accept-Language without a locale in the URL", () => {
    const response = routeRequest(request("/shopping", { "accept-language": "en-GB" }), signedIn);
    expect(rewrittenPath(response)).toBe("/en/shopping");
  });

  it("NFR-I18N-001 uses the locale cookie set from the profile before Accept-Language", () => {
    const response = routeRequest(
      request("/", { cookie: "hoem-locale=en", "accept-language": "fr" }),
      signedIn,
    );
    expect(rewrittenPath(response)).toBe("/en");
  });

  it("NFR-I18N-001 falls back to English without a cookie or header", () => {
    expect(rewrittenPath(routeRequest(request("/planner"), signedIn))).toBe("/en/planner");
  });

  it("NFR-I18N-001 keeps the query string when it rewrites", () => {
    expect(rewrittenPath(routeRequest(request("/expenses?month=2026-10"), signedIn))).toBe(
      "/en/expenses?month=2026-10",
    );
  });

  it("NFR-I18N-001 redirects a URL that names a locale to the same page without it", () => {
    const response = routeRequest(request("/en/shopping?list=1"), signedIn);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://hoemapp.com/shopping?list=1");
  });

  it("NFR-I18N-001 redirects the bare locale path to the home page", () => {
    expect(routeRequest(request("/en"), signedIn).headers.get("location")).toBe(
      "https://hoemapp.com/",
    );
  });

  it("FR-ACC-001 sends a signed-out visitor to sign-in, remembering the page", () => {
    const response = routeRequest(request("/expenses?month=2026-10"), signedOut);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://hoemapp.com/sign-in?next=%2Fexpenses%3Fmonth%3D2026-10",
    );
  });

  it("FR-ACC-001 sends a signed-out visitor of Home to sign-in without a next parameter", () => {
    expect(routeRequest(request("/"), signedOut).headers.get("location")).toBe(
      "https://hoemapp.com/sign-in",
    );
  });

  it.each(["/sign-in", "/sign-up", "/auth/confirm"])(
    "FR-ACC-001 lets a signed-out visitor open %s",
    (path) => {
      expect(rewrittenPath(routeRequest(request(path), signedOut))).toBe(`/en${path}`);
    },
  );

  it.each(["/sign-in", "/sign-up"])("FR-ACC-001 sends a signed-in user from %s to Home", (path) => {
    expect(routeRequest(request(path), signedIn).headers.get("location")).toBe(
      "https://hoemapp.com/",
    );
  });
});

describe("config.matcher", () => {
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
