import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Logo } from "@/design-system";
import { destinations, sidebarOrder } from "../domain/destinations";
import { destinationIcons } from "./destination-icons";
import { NavLink } from "./nav-link";
import { SidebarProfile } from "./profile-entries";

// From bp-md. The current entry gets the tint and a bolder label, so it is marked by more than
// colour. The household switcher joins it under the logo in #20.
export function Sidebar() {
  const t = useTranslations("Shell");
  const tMetadata = useTranslations("Metadata");
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-sidebar-width flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-4 py-6 md:flex">
      <div className="px-3">
        <Logo label={tMetadata("title")} />
      </div>
      <nav aria-label={t("mainNavigation")} className="flex flex-col gap-1">
        {sidebarOrder.map((destination) => {
          const Icon = destinationIcons[destination];
          return (
            <NavLink
              key={destination}
              href={destinations[destination]}
              className="flex h-control-height items-center gap-3 rounded-md px-3 text-body font-medium text-text hover:bg-surface-subtle aria-[current=page]:bg-brand-tint aria-[current=page]:font-bold aria-[current=page]:text-brand-ink"
            >
              <Icon aria-hidden="true" className="size-icon-lg" strokeWidth={1.5} />
              {t(`destinations.${destination}`)}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Suspense>
          <SidebarProfile />
        </Suspense>
      </div>
    </aside>
  );
}
