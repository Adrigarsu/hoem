import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageField } from "@/features/profile";
import { SettingsSubpage } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/language">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("language") };
}

// The language on phones (FR-ACC-007); wider screens have it in the cards of /settings.
export default async function LanguagePage({ params }: PageProps<"/[locale]/settings/language">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return (
    <SettingsSubpage title={t("language")}>
      <LanguageField locale={locale} />
    </SettingsSubpage>
  );
}
