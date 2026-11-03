import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { plusJakartaSans } from "@/lib/fonts";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";
import { supportedLocales } from "@/lib/i18n/locales";
import { ThemeScript } from "@/lib/theme/theme-script";
import "../globals.css";

// One static shell per locale; src/proxy.ts rewrites every request to one of them.
export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await setLocaleFromParams(params);
  return (
    // The script in <head> sets data-theme before React hydrates, on purpose.
    <html lang={locale} className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
