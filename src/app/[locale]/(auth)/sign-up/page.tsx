import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignUp } from "@/features/auth";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Auth.signUp" });
  return { title: t("title") };
}

export default async function SignUpPage({ params }: PageProps<"/[locale]/sign-up">) {
  await setLocaleFromParams(params);
  // The form reads the pending sign-up cookie, which only exists per request (Cache Components).
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}
