import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { settingsPaths } from "@/features/settings";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/account">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("account") };
}

// #22 builds editing the profile.
export default async function AccountPage({ params }: PageProps<"/[locale]/settings/account">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return (
    <ComingSoon
      title={t("account")}
      back={{ href: settingsPaths.settings, label: t("backToSettings") }}
    />
  );
}
