import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EmailForm, ownAccount } from "@/features/auth";
import { AccountForm, ownProfile } from "@/features/profile";
import { settingsPaths } from "@/features/settings";
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
export default async function AccountPage({
  params,
  searchParams,
}: PageProps<"/[locale]/settings/account">) {
  const locale = await setLocaleFromParams(params);
  return (
    <Suspense fallback={<LaunchScreen />}>
      <Account locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

// ?error= comes from a confirmation link that failed (/auth/confirm).
const linkFailures = ["linkExpired", "generic"] as const;

async function Account({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations({ locale, namespace: "Settings" });
  const [profile, account, { error }] = await Promise.all([
    ownProfile(),
    ownAccount(),
    searchParams,
  ]);
  const linkError = linkFailures.find((failure) => failure === error);
  return (
    <SettingsSubpage title={t("account")}>
      <AccountForm
        profile={profile}
        email={
          <EmailForm
            account={account}
            passwordHref={settingsPaths.password}
            linkError={linkError}
          />
        }
      />
    </SettingsSubpage>
  );
}
