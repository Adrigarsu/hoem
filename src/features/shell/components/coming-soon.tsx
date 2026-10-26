import { Construction } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { buttonClassName, EmptyState } from "@/design-system";
import { Page } from "./page";

type ComingSoonProps = {
  title: string;
  // What the page already offers, such as sign-out on settings.
  children?: ReactNode;
};

// A destination whose module is not built yet (home.md, "Module not built yet").
export function ComingSoon({ title, children }: ComingSoonProps) {
  const t = useTranslations("Shell.comingSoon");
  return (
    <Page title={<h1 className="text-title font-bold md:text-heading">{title}</h1>}>
      <EmptyState
        icon={Construction}
        title={t("title")}
        text={t("text", { section: title })}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className={buttonClassName("secondary")}>
              {t("backHome")}
            </Link>
            {children}
          </div>
        }
      />
    </Page>
  );
}
