import type { LucideIcon } from "lucide-react";

// A round tile that illustrates a message, such as the envelope on "Check your inbox". It is
// decorative: the heading next to it carries the meaning.
export function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink"
    >
      <Icon className="size-icon-lg" strokeWidth={1.5} />
    </span>
  );
}
