import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NewHouseholdForm } from "@/features/households";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/households/new">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Households.new" });
  return { title: t("title") };
}

// Reached from "Create a new household" in Settings until the switcher (#20) exists.
export default async function NewHouseholdPage({ params }: PageProps<"/[locale]/households/new">) {
  await setLocaleFromParams(params);
  return <NewHouseholdForm cancelHref="/settings" />;
}
