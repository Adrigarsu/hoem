import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { supportedLocales, type Locale } from "./locales";

// Every layout and page under [locale] calls this first: next-intl needs the locale set per
// segment for static rendering, and an unknown segment such as /fr is a 404.
export async function setLocaleFromParams(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!hasLocale(supportedLocales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}
