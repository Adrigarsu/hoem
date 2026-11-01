import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormMessage } from "@/design-system";
import {
  HouseholdDetails,
  householdGateway,
  householdSettings,
  type HouseholdSettingsView,
} from "@/features/households";
import { Page } from "@/features/shell";
import { NotFoundError } from "@/lib/errors";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

type Props = PageProps<"/[locale]/settings/household/[id]">;

// A household the user does not belong to, or an id that is not one, is simply not found.
async function load(id: string): Promise<HouseholdSettingsView> {
  try {
    return await householdSettings(await householdGateway(), id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Households.settings" });
  return { title: t("title") };
}

// Household settings (household-settings.md): #19 builds Details; Members (#26) and the rules
// (#30, #31) come later.
export default async function HouseholdSettingsPage({ params, searchParams }: Props) {
  const locale = await setLocaleFromParams(params);
  const { id } = await params;
  const { created } = await searchParams;
  const t = await getTranslations({ locale, namespace: "Households.settings" });
  const household = await load(id);

  return (
    <Page
      title={
        <div className="flex flex-col gap-2">
          <Link
            href="/settings"
            className="-ml-3 inline-flex h-control-height items-center gap-1 self-start rounded-md px-3 text-label text-brand hover:bg-surface-subtle"
          >
            <ChevronLeft aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
            {t("back")}
          </Link>
          <h1 className="text-title font-bold text-text md:text-heading">{household.name}</h1>
          <p className="text-body text-text-secondary">
            {household.isOwner ? t("youAreOwner") : t("youAreMember")}
          </p>
        </div>
      }
    >
      <div className="flex max-w-content-width flex-col gap-4">
        {created === "1" && (
          <FormMessage tone="success">{t("created", { name: household.name })}</FormMessage>
        )}
        <HouseholdDetails household={household} />
      </div>
    </Page>
  );
}
