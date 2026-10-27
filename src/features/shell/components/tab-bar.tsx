import { useTranslations } from "next-intl";
import { destinations, tabBarOrder } from "../domain/destinations";
import { destinationIcons } from "./destination-icons";
import { NavLink } from "./nav-link";

// Phones and small tablets (below bp-md). Sticky, not fixed, so it takes its own space at the end
// of the page and never covers the content above it. The current tab gets the pill and a bolder
// label, so it is marked by more than colour.
export function TabBar() {
  const t = useTranslations("Shell");
  return (
    <nav
      aria-label={t("mainNavigation")}
      className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-border bg-surface py-2 md:hidden"
    >
      {tabBarOrder.map((destination) => {
        const Icon = destinationIcons[destination];
        return (
          <NavLink
            key={destination}
            href={destinations[destination]}
            className="group flex min-h-12 flex-col items-center justify-center gap-1 text-caption text-text-secondary aria-[current=page]:font-bold aria-[current=page]:text-brand"
          >
            <span className="grid place-items-center rounded-full px-4 py-1 group-aria-[current=page]:bg-brand-tint group-aria-[current=page]:text-brand-ink">
              <Icon aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
            </span>
            {t(`destinations.${destination}`)}
          </NavLink>
        );
      })}
    </nav>
  );
}
