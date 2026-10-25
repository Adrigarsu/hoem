import { describe, expect, it } from "vitest";
import { resolveLocale } from "./resolve-locale";

// A wider list than the app ships, so the ordering rules are tested before Spanish exists.
const supported = ["en", "es", "fr"] as const;

describe("resolveLocale", () => {
  it("NFR-I18N-001 uses the profile locale when it is supported", () => {
    expect(resolveLocale({ profileLocale: "es", acceptLanguage: "fr" }, supported)).toBe("es");
  });

  it("NFR-I18N-001 ignores an unsupported profile locale and uses Accept-Language", () => {
    expect(resolveLocale({ profileLocale: "de", acceptLanguage: "fr" }, supported)).toBe("fr");
  });

  it("NFR-I18N-001 picks the supported language with the highest q value", () => {
    const acceptLanguage = "es;q=0.4, de;q=0.95, fr;q=0.9";
    expect(resolveLocale({ profileLocale: null, acceptLanguage }, supported)).toBe("fr");
  });

  it("NFR-I18N-001 matches a regional tag to its language", () => {
    expect(resolveLocale({ profileLocale: null, acceptLanguage: "es-ES" }, supported)).toBe("es");
  });

  it("NFR-I18N-001 skips languages the browser marks with q=0", () => {
    const acceptLanguage = "es;q=0, fr;q=0.1";
    expect(resolveLocale({ profileLocale: null, acceptLanguage }, supported)).toBe("fr");
  });

  it("NFR-I18N-001 skips entries with an empty or invalid q value", () => {
    const acceptLanguage = "es;q=, fr;q=abc, en;q=0.2";
    expect(resolveLocale({ profileLocale: null, acceptLanguage }, supported)).toBe("en");
  });

  it("NFR-I18N-001 falls back to English without a profile locale or header", () => {
    expect(resolveLocale({ profileLocale: null, acceptLanguage: null }, supported)).toBe("en");
  });

  it("NFR-I18N-001 falls back to English when the header is malformed", () => {
    expect(resolveLocale({ profileLocale: null, acceptLanguage: ";;q=x,," }, supported)).toBe("en");
  });

  it("NFR-I18N-001 only returns locales the app ships", () => {
    expect(resolveLocale({ profileLocale: "es", acceptLanguage: "fr" })).toBe("en");
  });
});
