import { ChevronRight, Download, Plus, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { buttonClassName, Card } from "@/design-system";
import { householdSettingsPath, newHouseholdPath, type HouseholdType } from "@/features/households";
import { settingsPaths } from "../domain/sections";

export type SettingsHousehold = { id: string; name: string; type: HouseholdType };

// The parts the menu of phones and the cards of wider screens have in common.
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card aria-labelledby={id}>
      <h2 id={id} className="text-subtitle text-text">
        {title}
      </h2>
      {children}
    </Card>
  );
}

export function HouseholdSection({
  id,
  households,
}: {
  id: string;
  households: readonly SettingsHousehold[];
}) {
  const t = useTranslations("Settings");
  const tHouseholds = useTranslations("Households");
  return (
    <Section id={id} title={t("household")}>
      {/* An empty list would still be announced as "list, 0 items". */}
      {households.length > 0 && (
        <ul className="flex flex-col">
          {households.map((household) => (
            <li key={household.id}>
              <Row
                href={householdSettingsPath(household.id)}
                label={household.name}
                detail={tHouseholds(`types.${household.type}`)}
              />
            </li>
          ))}
        </ul>
      )}
      <Link href={newHouseholdPath} className={buttonClassName("secondary")}>
        <Plus aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        {tHouseholds("list.create")}
      </Link>
    </Section>
  );
}

export function PrivacyRows() {
  const t = useTranslations("Settings");
  return (
    <ul className="flex flex-col">
      <li>
        <Row href={settingsPaths.downloadData} label={t("download")} icon={Download} />
      </li>
      <li>
        <Row href={settingsPaths.deleteAccount} label={t("delete")} icon={Trash2} danger />
      </li>
    </ul>
  );
}

type RowProps = {
  href: string;
  label: string;
  // Under the label, such as a household's type.
  detail?: string;
  // The current setting, on the right.
  value?: string;
  icon?: LucideIcon;
  // Destructive: the icon and the label say it, the colour only repeats it.
  danger?: boolean;
};

export function Row({ href, label, detail, value, icon: Icon, danger = false }: RowProps) {
  // Each tone keeps an approved colour pair on hover too: danger-ink on danger-tint.
  const tone = danger
    ? "text-danger hover:bg-danger-tint hover:text-danger-ink"
    : "text-text hover:bg-surface-subtle";
  return (
    <Link
      href={href}
      className={`-mx-3 flex min-h-control-height items-center gap-3 rounded-md px-3 py-2 ${tone}`}
    >
      {Icon && <Icon aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-strong">{label}</span>
        {detail && <Separated className="text-small text-text-secondary">{detail}</Separated>}
      </span>
      {value && <Separated className="text-body text-text-secondary">{value}</Separated>}
      <ChevronRight
        aria-hidden="true"
        className="size-icon-md text-text-secondary"
        strokeWidth={1.5}
      />
    </Link>
  );
}

// A hidden comma between a label and its value, so a screen reader pauses between them
// ("Appearance, System") instead of reading one phrase.
function Separated({ className, children }: { className: string; children: string }) {
  return (
    <span className={className}>
      <span className="sr-only">,</span>
      {children}
    </span>
  );
}
