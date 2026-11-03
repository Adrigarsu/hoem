import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyTheme, themeCookie, themeCookieAttributes, themeScript, toTheme } from "./theme";

// Runs the inline script the way the browser does when it parses <head>.
function runThemeScript() {
  document.head.innerHTML = "";
  const script = document.createElement("script");
  script.textContent = themeScript;
  document.head.append(script);
}

function clearCookie() {
  document.cookie = `${themeCookie}=; path=/; max-age=0`;
}

describe("theme", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    clearCookie();
  });

  afterEach(clearCookie);

  it("FR-ACC-007 follows the system when no theme was chosen", () => {
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("FR-ACC-007 the theme script applies a chosen theme", () => {
    document.cookie = `${themeCookie}=dark; path=/`;
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("FR-ACC-007 the theme script leaves the system theme alone", () => {
    document.cookie = `${themeCookie}=system; path=/`;
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("FR-ACC-007 the theme script ignores an unknown cookie value", () => {
    document.cookie = `${themeCookie}=purple; path=/`;
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("FR-ACC-007 applying a chosen theme sets the attribute and remembers it", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain(`${themeCookie}=dark`);
  });

  it("FR-ACC-007 going back to the system theme removes the attribute", () => {
    applyTheme("dark");
    applyTheme("system");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).toContain(`${themeCookie}=system`);
  });

  it("FR-ACC-007 treats an unknown stored theme as the system theme", () => {
    expect(toTheme("purple")).toBe("system");
  });

  it("FR-ACC-007 keeps the cookie Secure on https only", () => {
    expect(themeCookieAttributes("https:")).toContain("secure");
    expect(themeCookieAttributes("http:")).not.toContain("secure");
  });
});
