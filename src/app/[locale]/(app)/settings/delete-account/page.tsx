import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { settingsPaths } from "@/features/settings";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/delete-account">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("delete") };
}

// #23 builds deleting the account.
export default async function DeleteAccountPage({
  params,
}: PageProps<"/[locale]/settings/delete-account">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return (
    <ComingSoon
      title={t("delete")}
      back={{ href: settingsPaths.settings, label: t("backToSettings") }}
    />
  );
}
