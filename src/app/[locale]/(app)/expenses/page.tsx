import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/expenses">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell.destinations" });
  return { title: t("expenses") };
}

// Until the module's milestone, its tab opens "Coming soon" (home.md).
export default async function ExpensesPage({ params }: PageProps<"/[locale]/expenses">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell.destinations" });
  return <ComingSoon title={t("expenses")} />;
}
