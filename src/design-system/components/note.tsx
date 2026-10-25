import { Info } from "lucide-react";
import type { ReactNode } from "react";

// Extra information that is always on screen, so it is read in place instead of announced.
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md bg-surface-subtle p-4 text-small text-text">
      {/* As tall as one line of text, so the icon lines up with the first line. */}
      <span className="flex h-5 shrink-0 items-center">
        <Info aria-hidden="true" className="size-icon-sm" strokeWidth={1.5} />
      </span>
      <span>{children}</span>
    </p>
  );
}
