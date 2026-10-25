import { useTranslations } from "next-intl";
import { Logo, ModuleChip } from "@/design-system";

// The left half of the desktop auth pages (sign-in.md, "Layout — desktop").
export function BrandPanel() {
  const t = useTranslations("Auth");
  return (
    <>
      <Logo label={t("brand")} tone="on-brand" />
      <div className="flex max-w-column-narrow flex-col gap-4">
        <p className="text-display">{t("panel.title")}</p>
        <p className="text-body text-brand-tint">{t("panel.text")}</p>
      </div>
      <ul className="flex flex-wrap gap-3">
        <ModuleChip module="meals" label={t("panel.meals")} />
        <ModuleChip module="shopping" label={t("panel.shopping")} />
        <ModuleChip module="expenses" label={t("panel.expenses")} />
      </ul>
    </>
  );
}
