// NFR-I18N-002: format only for display, with Intl. Stored and summed values stay integers.

export function formatMoney(amountCents: number, currency: string, locale: string): string {
  if (!Number.isSafeInteger(amountCents)) {
    throw new Error(`Money must be a whole number of cents: ${amountCents}`);
  }
  const formatter = moneyFormatter(locale, currency);
  // The currency's ISO 4217 minor units: 2 for EUR, 0 for JPY.
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(toDecimalString(amountCents, digits));
}

// Building an Intl formatter is costly; a list of expenses reuses one per locale and currency.
const moneyFormatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}|${currency}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    moneyFormatters.set(key, formatter);
  }
  return formatter;
}

// Intl formats a decimal string exactly, so cents never become a float: 4320 → "43.20".
function toDecimalString(amountCents: number, digits: number): `${number}` {
  const sign = amountCents < 0 ? "-" : "";
  const units = String(Math.abs(amountCents)).padStart(digits + 1, "0");
  const whole = units.slice(0, units.length - digits);
  const fraction = units.slice(units.length - digits);
  return `${sign}${whole}${digits > 0 ? `.${fraction}` : ""}` as `${number}`;
}

// A calendar day ("2026-10-25", SQL date) has no time zone: format it in UTC so it never moves.
export function formatDay(
  day: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const instant = parseDay(day);
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(instant);
}

function parseDay(day: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) throw new Error(`Not a calendar day (YYYY-MM-DD): ${day}`);
  const [, year, month, date] = match.map(Number) as [number, number, number, number];
  const instant = new Date(0);
  // setUTCFullYear, unlike Date.UTC, does not turn years 0–99 into 1900–1999.
  instant.setUTCFullYear(year, month - 1, date);
  // Date rolls 2026-02-30 over to 2 March; a real day survives the round trip.
  if (instant.toISOString().slice(0, 10) !== day) {
    throw new Error(`Not a calendar day (YYYY-MM-DD): ${day}`);
  }
  return instant;
}

// An instant (SQL timestamptz) is shown in the user's own time zone.
export function formatInstant(
  instant: Date,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(instant);
}

// Today as Home shows it under the greeting: "Monday, October 26".
export function formatToday(instant: Date, locale: string, timeZone: string): string {
  return formatInstant(instant, locale, timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
