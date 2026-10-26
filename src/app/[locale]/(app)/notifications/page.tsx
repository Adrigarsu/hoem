import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/notifications">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell" });
  return { title: t("notifications") };
}

// The notification centre arrives with M5.
export default async function NotificationsPage({ params }: PageProps<"/[locale]/notifications">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell" });
  return <ComingSoon title={t("notifications")} />;
}
