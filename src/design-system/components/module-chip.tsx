import { ShoppingCart, UtensilsCrossed, Wallet, type LucideIcon } from "lucide-react";

// Each module keeps its accent, always with its icon and name (design-system principle 5).
const modules: Record<"meals" | "shopping" | "expenses", { icon: LucideIcon; ink: string }> = {
  meals: { icon: UtensilsCrossed, ink: "text-meals-ink" },
  shopping: { icon: ShoppingCart, ink: "text-shopping-ink" },
  expenses: { icon: Wallet, ink: "text-expenses-ink" },
};

type ModuleChipProps = { module: keyof typeof modules; label: string };

// A list item: put chips inside a <ul>.
export function ModuleChip({ module, label }: ModuleChipProps) {
  const { icon: Icon, ink } = modules[module];
  return (
    <li
      className={`inline-flex h-control-height-sm items-center gap-2 rounded-full bg-surface px-4 text-label ${ink}`}
    >
      <Icon aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
      {label}
    </li>
  );
}
