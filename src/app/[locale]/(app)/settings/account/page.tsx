import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountForm, ownProfile } from "@/features/profile";
import { LaunchScreen, SettingsSubpage } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/account">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("account") };
}

// Editing the profile on phones (FR-ACC-007); wider screens do it in the cards of /settings.
export default async function AccountPage({ params }: PageProps<"/[locale]/settings/account">) {
  const locale = await setLocaleFromParams(params);
  return (
    <Suspense fallback={<LaunchScreen />}>
      <Account locale={locale} />
    </Suspense>
  );
}

async function Account({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Settings" });
  const profile = await ownProfile();
  return (
    <SettingsSubpage title={t("account")}>
      <AccountForm profile={profile} />
    </SettingsSubpage>
  );
}
