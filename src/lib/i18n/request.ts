import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, supportedLocales } from "./locales";

// The locale arrives from the [locale] segment, which src/proxy.ts fills in (ADR-012).
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(supportedLocales, requested) ? requested : defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, messages };
});
