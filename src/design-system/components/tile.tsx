import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { moduleIcons, type Module } from "./module-icons";

// Each module keeps its accent, always with its icon and name (design-system principle 5).
const tiles: Record<Module, string> = {
  meals: "bg-meals-tint text-meals-ink",
  shopping: "bg-shopping-tint text-shopping-ink",
  expenses: "bg-expenses-tint text-expenses-ink",
};

type TileProps = {
  module: Module;
  href: string;
  label: string;
  headline: string;
  meta: string;
};

// A module on Home: one link whose accessible name is its visible text in order (home.md).
export function Tile({ module, href, label, headline, meta }: TileProps) {
  const Icon = moduleIcons[module];
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-text transition-colors duration-fast hover:bg-surface-subtle"
    >
      <span className="mb-1 flex items-center justify-between">
        <span
          aria-hidden="true"
          className={`grid size-10 place-items-center rounded-md ${tiles[module]}`}
        >
          <Icon className="size-icon-md" strokeWidth={1.5} />
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-icon-md text-text-secondary"
          strokeWidth={1.5}
        />
      </span>
      {/* The spaces keep the words apart in the accessible name; flex layout does not show them. */}
      <span className="text-label">{label}</span>{" "}
      <span className="text-subtitle font-bold">{headline}</span>{" "}
      <span className="text-caption text-text-secondary">{meta}</span>
    </Link>
  );
}
