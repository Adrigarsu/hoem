import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Auth.signIn" });
  return { title: t("title") };
}

export default async function SignInPage({ params }: PageProps<"/[locale]/sign-in">) {
  await setLocaleFromParams(params);
  // The form reads ?next= and ?error=, which only exist per request; the rest of the page stays
  // in the static shell (Cache Components).
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
