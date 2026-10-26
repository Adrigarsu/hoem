import { describe, expect, it } from "vitest";
import {
  destinations,
  isCurrent,
  pathWithoutLocale,
  sidebarOrder,
  tabBarOrder,
} from "./destinations";

describe("navigation order", () => {
  it("FR-NAV-001 lists the tab bar as Shopping, Expenses, Home, Planner and Meals", () => {
    expect(tabBarOrder).toEqual(["shopping", "expenses", "home", "planner", "meals"]);
  });

  it("FR-NAV-001 lists the sidebar as Home, Planner, Meals, Shopping and Expenses", () => {
    expect(sidebarOrder).toEqual(["home", "planner", "meals", "shopping", "expenses"]);
  });
});

describe("isCurrent", () => {
  it("FR-NAV-001 marks a destination current on its own page", () => {
    expect(isCurrent("/meals", destinations.meals)).toBe(true);
  });

  it("FR-NAV-001 marks a destination current on its sub-pages", () => {
    expect(isCurrent("/meals/recipes/1", destinations.meals)).toBe(true);
  });

  it("FR-NAV-001 does not mark a destination current on a page that only starts like it", () => {
    expect(isCurrent("/mealsplanner", destinations.meals)).toBe(false);
  });

  it("FR-NAV-001 marks Home current only on Home itself", () => {
    expect(isCurrent("/meals", destinations.home)).toBe(false);
  });

  it("FR-NAV-001 marks Home current on Home", () => {
    expect(isCurrent("/", destinations.home)).toBe(true);
  });
});

describe("pathWithoutLocale", () => {
  it("FR-NAV-001 reads the address the user sees from the internal /en/meals route", () => {
    expect(pathWithoutLocale("/en/meals", "en")).toBe("/meals");
  });

  it("FR-NAV-001 reads Home from the internal /en route", () => {
    expect(pathWithoutLocale("/en", "en")).toBe("/");
  });

  it("FR-NAV-001 leaves an address without the locale as it is", () => {
    expect(pathWithoutLocale("/english-breakfast", "en")).toBe("/english-breakfast");
  });
});
