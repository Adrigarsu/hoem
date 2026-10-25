import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CheckYourInbox } from "@/features/auth";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/check-your-inbox">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Auth.checkInbox" });
  return { title: t("title") };
}

export default async function CheckYourInboxPage({
  params,
}: PageProps<"/[locale]/check-your-inbox">) {
  await setLocaleFromParams(params);
  // The address comes from a cookie, which only exists per request (Cache Components).
  return (
    <Suspense>
      <CheckYourInbox />
    </Suspense>
  );
}
