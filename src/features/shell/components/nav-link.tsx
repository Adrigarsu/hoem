"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { isCurrent, pathWithoutLocale } from "../domain/destinations";

type NavLinkProps = { href: string; className?: string; children: ReactNode };

// A navigation link that says when it is the current page (aria-current); its styles use the
// aria-[current=page]: variant, so the look and the announcement never disagree.
export function NavLink({ href, className, children }: NavLinkProps) {
  const current = isCurrent(pathWithoutLocale(usePathname(), useLocale()), href);
  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
