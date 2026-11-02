import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { settingsPaths } from "@/features/settings";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/appearance">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("appearance") };
}

// #22 builds choosing the theme.
export default async function AppearancePage({
  params,
}: PageProps<"/[locale]/settings/appearance">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return (
    <ComingSoon
      title={t("appearance")}
      back={{ href: settingsPaths.settings, label: t("backToSettings") }}
    />
  );
}
