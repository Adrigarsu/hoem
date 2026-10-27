// The app's main destinations (FR-NAV-001). Both navigations list the same five, in a different
// order: the tab bar keeps Home in the centre, the sidebar starts with it.
export const destinations = {
  home: "/",
  planner: "/planner",
  meals: "/meals",
  shopping: "/shopping",
  expenses: "/expenses",
} as const;

export type Destination = keyof typeof destinations;

export const tabBarOrder: readonly Destination[] = [
  "shopping",
  "expenses",
  "home",
  "planner",
  "meals",
];

export const sidebarOrder: readonly Destination[] = [
  "home",
  "planner",
  "meals",
  "shopping",
  "expenses",
];

// A link stays current on its sub-pages (a recipe is still Meals); Home only on itself.
export function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The locale is not in the address (ADR-015), but the server renders the internal route it is
// rewritten to, /en/meals; both must mark the same link current.
export function pathWithoutLocale(pathname: string, locale: string): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}
