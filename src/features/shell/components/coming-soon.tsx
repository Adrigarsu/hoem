import { Construction } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonClassName, EmptyState } from "@/design-system";
import { Page } from "./page";

type ComingSoonProps = {
  title: string;
  // Where "Back" leads, such as the settings menu for one of its sections; Home by default.
  back?: { href: string; label: string };
};

// A destination whose module is not built yet (home.md, "Module not built yet").
export function ComingSoon({ title, back }: ComingSoonProps) {
  const t = useTranslations("Shell.comingSoon");
  return (
    <Page title={<h1 className="text-title font-bold text-text md:text-heading">{title}</h1>}>
      <EmptyState
        icon={Construction}
        title={t("title")}
        text={t("text", { section: title })}
        action={
          <Link href={back?.href ?? "/"} className={buttonClassName("secondary")}>
            {back?.label ?? t("backHome")}
          </Link>
        }
      />
    </Page>
  );
}
