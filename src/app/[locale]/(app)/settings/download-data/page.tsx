import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { settingsPaths } from "@/features/settings";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/download-data">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("download") };
}

// Exporting personal data (NFR-LEG-003) is not planned in an issue yet.
export default async function DownloadDataPage({
  params,
}: PageProps<"/[locale]/settings/download-data">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return (
    <ComingSoon
      title={t("download")}
      back={{ href: settingsPaths.settings, label: t("backToSettings") }}
    />
  );
}
