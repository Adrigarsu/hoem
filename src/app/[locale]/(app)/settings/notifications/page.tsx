import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { settingsPaths } from "@/features/settings";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/notifications">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("notifications") };
}

// M5 builds the notification preferences.
export default async function NotificationsPage({
  params,
}: PageProps<"/[locale]/settings/notifications">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return (
    <ComingSoon
      title={t("notifications")}
      back={{ href: settingsPaths.settings, label: t("backToSettings") }}
    />
  );
}
