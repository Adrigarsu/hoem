import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignOutButton } from "@/features/auth";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell" });
  return { title: t("profileAndSettings") };
}

// #21 builds the profile and settings menu; until then this page keeps sign-out within reach.
export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell" });
  return (
    <ComingSoon title={t("profileAndSettings")}>
      <SignOutButton />
    </ComingSoon>
  );
}
