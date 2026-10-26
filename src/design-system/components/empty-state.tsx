import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./icon-tile";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  text: string;
  // A page that is only this state makes it the page's h1.
  headingLevel?: 1 | 2;
  action?: ReactNode;
};

// What a screen shows when it has nothing yet, or when its module is not built yet.
export function EmptyState({ icon, title, text, headingLevel = 2, action }: EmptyStateProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <IconTile icon={icon} />
      <Heading className="mt-2 text-subtitle">{title}</Heading>
      <p className="max-w-column-narrow text-body text-text-secondary">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
