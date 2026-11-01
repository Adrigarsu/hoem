import type { Metadata } from "next";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClassName } from "@/design-system";
import { SignOutButton } from "@/features/auth";
import {
  householdGateway,
  householdSettingsPath,
  myHouseholds,
  newHouseholdPath,
} from "@/features/households";
import { ComingSoon } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell" });
  return { title: t("profileAndSettings") };
}

// #21 builds the profile and settings menu; until then this page keeps sign-out and the households
// (profile.md, "Households") within reach.
export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Shell" });
  const tHouseholds = await getTranslations({ locale, namespace: "Households" });
  const households = await myHouseholds(await householdGateway());
  return (
    <ComingSoon title={t("profileAndSettings")}>
      <SignOutButton />
      <section aria-labelledby="your-households" className="flex w-full flex-col gap-3 text-left">
        <h2 id="your-households" className="text-subtitle text-text">
          {tHouseholds("list.title")}
        </h2>
        <ul className="flex flex-col gap-2">
          {households.map((household) => (
            <li key={household.id}>
              <Link
                href={householdSettingsPath(household.id)}
                className="flex min-h-control-height items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 hover:bg-surface-subtle"
              >
                <span className="flex flex-col">
                  <span className="text-body-strong text-text">{household.name}</span>
                  <span className="text-small text-text-secondary">
                    {tHouseholds(`types.${household.type}`)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-icon-md text-text-secondary"
                  strokeWidth={1.5}
                />
              </Link>
            </li>
          ))}
        </ul>
        <Link href={newHouseholdPath} className={buttonClassName("secondary")}>
          <Plus aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
          {tHouseholds("list.create")}
        </Link>
      </section>
    </ComingSoon>
  );
}
