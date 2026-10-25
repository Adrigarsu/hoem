import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

// The negative margin lines the chevron up with the content while the link keeps a 44 px target.
export function BackToSignIn() {
  const t = useTranslations("Auth");
  return (
    <Link
      href="/sign-in"
      className="-ml-3 inline-flex h-control-height items-center gap-1 self-start rounded-md px-3 text-label text-text hover:bg-surface-subtle"
    >
      <ChevronLeft aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
      {t("backToSignIn")}
    </Link>
  );
}
