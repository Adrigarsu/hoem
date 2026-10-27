"use client";

import { useEffect, useState, type ReactNode } from "react";

const alignments = {
  center: "left-1/2 -translate-x-1/2",
  // For controls at the right edge, so the tooltip never runs off the screen.
  end: "right-0",
};

type TooltipProps = {
  label: string;
  align?: keyof typeof alignments;
  children: ReactNode;
};

// Shows a control's label on hover and on focus (NFR-A11Y-004) and meets WCAG 1.4.13: it stays
// open while the pointer moves onto it, and Escape hides it wherever focus is, without moving
// focus. The control already carries the label as its accessible name, so the tooltip is hidden
// from screen readers instead of being read twice.
export function Tooltip({ label, align = "center", children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    // The wrapper only listens: hover and focus bubble up from the control inside, which stays the
    // one interactive element.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        // The padding bridges the gap to the control, so the pointer can reach the tooltip
        // without leaving the wrapper.
        <span aria-hidden="true" className={`absolute top-full z-10 pt-2 ${alignments[align]}`}>
          <span className="block rounded-sm bg-text px-3 py-1 text-caption whitespace-nowrap text-bg">
            {label}
          </span>
        </span>
      )}
    </span>
  );
}
