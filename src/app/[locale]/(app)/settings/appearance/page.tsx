import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ownProfile, ThemeForm } from "@/features/profile";
import { LaunchScreen, SettingsSubpage } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/appearance">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("appearance") };
}

// Choosing the theme on phones (FR-ACC-007); wider screens do it in the cards of /settings.
export default async function AppearancePage({
  params,
}: PageProps<"/[locale]/settings/appearance">) {
  const locale = await setLocaleFromParams(params);
  return (
    <Suspense fallback={<LaunchScreen />}>
      <Appearance locale={locale} />
    </Suspense>
  );
}

async function Appearance({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Settings" });
  const profile = await ownProfile();
  return (
    <SettingsSubpage title={t("appearance")}>
      <ThemeForm theme={profile.theme} titled={false} />
    </SettingsSubpage>
  );
}
