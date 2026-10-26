import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavLink } from "./nav-link";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));

describe("NavLink", () => {
  it("FR-NAV-001 marks the current destination as the current page", () => {
    pathname.current = "/meals/recipes/1";
    render(<NavLink href="/meals">Meals</NavLink>);
    expect(screen.getByRole("link", { name: "Meals" })).toHaveAttribute("aria-current", "page");
  });

  it("FR-NAV-001 marks it on the server too, which renders the internal /en route", () => {
    pathname.current = "/en/meals";
    render(<NavLink href="/meals">Meals</NavLink>);
    expect(screen.getByRole("link", { name: "Meals" })).toHaveAttribute("aria-current", "page");
  });

  it("FR-NAV-001 leaves the other destinations unmarked", () => {
    pathname.current = "/meals";
    render(<NavLink href="/shopping">Shopping</NavLink>);
    expect(screen.getByRole("link", { name: "Shopping" })).not.toHaveAttribute("aria-current");
  });
});
