import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignOutButton } from "@/features/auth";
import { householdGateway, myHouseholds } from "@/features/households";
import { ownProfile } from "@/features/profile";
import { SettingsMenu } from "@/features/settings";
import { Page } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("title") };
}

// Profile and settings (FR-NAV-003, profile.md), opened from the avatar on phones and the sidebar
// on wider screens.
export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  const [profile, households] = await Promise.all([
    ownProfile(),
    householdGateway().then(myHouseholds),
  ]);

  return (
    <Page
      title={
        <div className="flex flex-col gap-2">
          {/* Wider screens keep the sidebar, so only phones need a way back. */}
          <Link
            href="/"
            className="-ml-3 inline-flex h-control-height items-center gap-1 self-start rounded-md px-3 text-label text-brand hover:bg-surface-subtle md:hidden"
          >
            <ChevronLeft aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
            {t("back")}
          </Link>
          <h1 className="text-title font-bold text-text md:text-heading">{t("title")}</h1>
          <p className="hidden text-body text-text-secondary md:block">{t("subtitle")}</p>
        </div>
      }
    >
      <SettingsMenu profile={profile} households={households} signOut={<SignOutButton />} />
    </Page>
  );
}
