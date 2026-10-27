import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Tooltip } from "./tooltip";

const className =
  "relative inline-grid size-control-height place-items-center rounded-md border border-border-control bg-surface text-text transition-colors duration-fast hover:bg-surface-subtle";

type CommonProps = {
  icon: LucideIcon;
  // The accessible name and the tooltip, from the messages file (NFR-A11Y-004).
  label: string;
  // A small brand dot, such as "new notifications". Never the only signal: say it in the label.
  dot?: boolean;
  tooltipAlign?: "center" | "end";
};

// With href it is a link, such as the bell that opens Notifications, and takes link attributes;
// without it, a button that takes button attributes. Either way they reach the element.
type IconButtonProps = CommonProps &
  (
    | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "children"> & {
        href: string;
      })
    | (Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
        href?: undefined;
      })
  );

export function IconButton({
  icon: Icon,
  label,
  dot = false,
  tooltipAlign,
  ...props
}: IconButtonProps) {
  const content = (
    <>
      <Icon aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
      {dot && (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 size-2 rounded-full bg-brand ring-2 ring-surface"
        />
      )}
    </>
  );

  return (
    <Tooltip label={label} align={tooltipAlign}>
      {props.href === undefined ? (
        <button type="button" {...props} aria-label={label} className={className}>
          {content}
        </button>
      ) : (
        <Link {...props} href={props.href} aria-label={label} className={className}>
          {content}
        </Link>
      )}
    </Tooltip>
  );
}
