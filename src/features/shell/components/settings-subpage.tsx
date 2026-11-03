import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Card } from "@/design-system";
import { settingsPaths } from "@/features/settings";
import { Page } from "./page";

// A page of its own for one setting, opened from the menu of phones. It also answers on wider
// screens, because the server does not know the width: an old link or a turned tablet still works.
export function SettingsSubpage({ title, children }: { title: string; children: ReactNode }) {
  const t = useTranslations("Settings");
  return (
    <Page
      title={
        <div className="flex flex-col gap-2">
          <Link
            href={settingsPaths.settings}
            className="-ml-3 inline-flex h-control-height items-center gap-1 self-start rounded-md px-3 text-label text-brand hover:bg-surface-subtle"
          >
            <ChevronLeft aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
            {t("backToSettings")}
          </Link>
          <h1
            id="settings-subpage-title"
            className="text-title font-bold text-text md:text-heading"
          >
            {title}
          </h1>
        </div>
      }
    >
      <Card aria-labelledby="settings-subpage-title" className="w-full max-w-content-width">
        {children}
      </Card>
    </Page>
  );
}
