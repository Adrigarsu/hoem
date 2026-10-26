import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/reset-password">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });
  return { title: t("title") };
}

// The link in the reset e-mail (supabase/templates/recovery.html) lands here.
export default async function ResetPasswordPage({
  params,
}: PageProps<"/[locale]/auth/reset-password">) {
  await setLocaleFromParams(params);
  // The form reads ?token_hash=, which only exists per request (Cache Components).
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
