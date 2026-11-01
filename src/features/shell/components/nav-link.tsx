"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Suspense, type ReactNode } from "react";
import { isCurrent, pathWithoutLocale } from "../domain/destinations";

type NavLinkProps = { href: string; className?: string; children: ReactNode };

// A navigation link that says when it is the current page (aria-current); its styles use the
// aria-[current=page]: variant, so the look and the announcement never disagree.
// On a route with a dynamic segment (/settings/household/[id]) the path is only known at request
// time, so the link is prerendered without the mark and gets it when the path streams in. Static
// routes resolve it while prerendering, so the fallback never shows there.
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<PlainLink {...props} current={false} />}>
      <CurrentNavLink {...props} />
    </Suspense>
  );
}

function CurrentNavLink(props: NavLinkProps) {
  const current = isCurrent(pathWithoutLocale(usePathname(), useLocale()), props.href);
  return <PlainLink {...props} current={current} />;
}

function PlainLink({ href, className, children, current }: NavLinkProps & { current: boolean }) {
  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
