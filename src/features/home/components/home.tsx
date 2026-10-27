import { Bell, CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Card, IconButton, Tile } from "@/design-system";
import { destinations, Page } from "@/features/shell";
import { homeTiles } from "../domain/tiles";
import { Greeting, GreetingSkeleton } from "./greeting";

// The hub (FR-NAV-002): every module, the notes and the notifications are one tap away. Until the
// modules exist, their tiles show the empty state and open "Coming soon" (home.md). The desktop
// dashboard with metrics comes with M6.
export function Home() {
  const t = useTranslations("Home");
  const tShell = useTranslations("Shell");
  return (
    <Page
      title={
        <Suspense fallback={<GreetingSkeleton />}>
          <Greeting />
        </Suspense>
      }
      actions={<IconButton icon={Bell} label={tShell("notifications")} href="/notifications" />}
    >
      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-2">
        <PlannerCard />
        <section aria-labelledby="your-home" className="flex flex-col gap-3">
          <h2 id="your-home" className="text-eyebrow text-text-secondary uppercase">
            {t("yourHome")}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {homeTiles.map((module) => (
              <li key={module}>
                <Tile
                  module={module}
                  href={destinations[module]}
                  label={tShell(`destinations.${module}`)}
                  headline={t(`tiles.${module}.headline`)}
                  meta={t(`tiles.${module}.meta`)}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}

function PlannerCard() {
  const t = useTranslations("Home");
  const tShell = useTranslations("Shell");
  return (
    <Card aria-labelledby="home-planner">
      <div className="flex items-center justify-between">
        <h2 id="home-planner" className="flex items-center gap-2 text-subtitle text-text">
          <CalendarDays aria-hidden="true" className="size-icon-md text-brand" strokeWidth={1.5} />
          {tShell("destinations.planner")}
        </h2>
        <Link
          href={destinations.planner}
          className="inline-flex min-h-control-height items-center text-label text-brand"
        >
          {t.rich("open", { hidden: (chunks) => <span className="sr-only">{chunks}</span> })}
        </Link>
      </div>
      {/* Looks like the quick-add field it becomes in M5; until then it opens the Planner. */}
      <Link
        href={destinations.planner}
        className="flex h-control-height items-center gap-2 rounded-md border border-border-control bg-surface px-4 text-body text-text-secondary hover:bg-surface-subtle"
      >
        <Plus aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        {t("writeNote")}
      </Link>
      <p className="text-small text-text-secondary">{t("noNotes")}</p>
    </Card>
  );
}
