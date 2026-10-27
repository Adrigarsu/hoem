import type { ComponentProps } from "react";

// A surface that groups one topic, such as the Planner on Home. Give it aria-labelledby with the
// id of its heading, so it is a named region.
export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-6 ${className}`}
      {...props}
    />
  );
}
