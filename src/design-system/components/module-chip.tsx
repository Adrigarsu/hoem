import { moduleIcons, type Module } from "./module-icons";

// Each module keeps its accent, always with its icon and name (design-system principle 5).
const inks: Record<Module, string> = {
  meals: "text-meals-ink",
  shopping: "text-shopping-ink",
  expenses: "text-expenses-ink",
};

type ModuleChipProps = { module: Module; label: string };

// A list item: put chips inside a <ul>.
export function ModuleChip({ module, label }: ModuleChipProps) {
  const Icon = moduleIcons[module];
  const ink = inks[module];
  return (
    <li
      className={`inline-flex h-control-height-sm items-center gap-2 rounded-full bg-surface px-4 text-label ${ink}`}
    >
      <Icon aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
      {label}
    </li>
  );
}
