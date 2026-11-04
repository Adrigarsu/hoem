import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ChangePasswordForm, ownAccount } from "@/features/auth";
import { LaunchScreen, SettingsSubpage } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/password">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Auth.changePassword" });
  return { title: t("changeTitle") };
}

// Change password, or Set a password for an account created with Google (FR-ACC-007), opened from
// Account settings on every width.
export default async function PasswordPage({ params }: PageProps<"/[locale]/settings/password">) {
  const locale = await setLocaleFromParams(params);
  return (
    <Suspense fallback={<LaunchScreen />}>
      <Password locale={locale} />
    </Suspense>
  );
}

async function Password({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Auth.changePassword" });
  const account = await ownAccount();
  return (
    <SettingsSubpage title={account.hasPassword ? t("changeTitle") : t("setTitle")}>
      <ChangePasswordForm account={account} />
    </SettingsSubpage>
  );
}
