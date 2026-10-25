import { describe, expect, it } from "vitest";
import { formatDay, formatInstant, formatMoney } from "./format";

describe("formatMoney", () => {
  it("NFR-I18N-002 formats 4320 EUR cents as €43.20 in English", () => {
    expect(formatMoney(4320, "EUR", "en")).toBe("€43.20");
  });

  it("NFR-I18N-002 formats a negative amount", () => {
    expect(formatMoney(-505, "EUR", "en")).toBe("-€5.05");
  });

  it("NFR-I18N-002 formats zero", () => {
    expect(formatMoney(0, "EUR", "en")).toBe("€0.00");
  });

  it("NFR-I18N-002 formats a currency without minor units", () => {
    expect(formatMoney(4320, "JPY", "en")).toBe("¥4,320");
  });

  it("NFR-I18N-002 follows the locale's number conventions", () => {
    expect(formatMoney(123456, "EUR", "es")).toBe("1234,56 €");
  });

  it("NFR-I18N-002 keeps the largest safe amount exact", () => {
    expect(formatMoney(Number.MAX_SAFE_INTEGER, "EUR", "en")).toBe("€90,071,992,547,409.91");
  });

  it("NFR-I18N-002 rejects an amount that is not a whole number of cents", () => {
    expect(() => formatMoney(43.2, "EUR", "en")).toThrow("whole number of cents");
  });
});

describe("formatDay", () => {
  it("NFR-I18N-002 formats a calendar day in the locale's style", () => {
    expect(formatDay("2026-10-25", "en")).toBe("Oct 25, 2026");
  });

  it("NFR-I18N-002 never shifts a calendar day by time zone", () => {
    expect(formatDay("2026-01-01", "en", { weekday: "long" })).toBe("Thursday");
  });

  it("NFR-I18N-002 rejects a value that is not a YYYY-MM-DD day", () => {
    expect(() => formatDay("25/10/2026", "en")).toThrow("Not a calendar day");
  });

  it("NFR-I18N-002 accepts a year below 100", () => {
    expect(formatDay("0050-01-01", "en", { year: "numeric" })).toBe("50");
  });

  it("NFR-I18N-002 rejects a day that does not exist", () => {
    expect(() => formatDay("2026-02-30", "en")).toThrow("Not a calendar day");
  });
});

describe("formatInstant", () => {
  it("NFR-I18N-002 shows an instant in the user's time zone", () => {
    const lateEvening = new Date("2026-10-25T23:30:00Z");
    expect(formatInstant(lateEvening, "en", "Europe/Madrid")).toBe("Oct 26, 2026, 12:30 AM");
  });
});
