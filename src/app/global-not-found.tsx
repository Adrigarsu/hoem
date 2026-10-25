import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { defaultLocale } from "@/lib/i18n/locales";
import { plusJakartaSans } from "@/lib/fonts";
import "./globals.css";

// Any URL that matches no route, including an unknown [locale] segment. It renders outside the
// [locale] layout, so it stays static and uses the default locale until Spanish exists.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: "NotFound" });
  return { title: t("title") };
}

export default async function GlobalNotFound() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "NotFound" });
  return (
    <html lang={defaultLocale} className={plusJakartaSans.variable}>
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
          <h1 className="text-heading">{t("title")}</h1>
          <p className="text-body text-text-secondary">{t("description")}</p>
        </main>
      </body>
    </html>
  );
}
