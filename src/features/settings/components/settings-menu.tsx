import { ChevronRight, Download, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Avatar, buttonClassName, Card, IconButton } from "@/design-system";
import { householdSettingsPath, newHouseholdPath, type HouseholdType } from "@/features/households";
import { settingsPaths } from "../domain/sections";

type SettingsMenuProps = {
  profile: { displayName: string; email: string };
  households: readonly { id: string; name: string; type: HouseholdType }[];
  // The sign-out form, from the auth feature.
  signOut: ReactNode;
};

// The profile and settings menu (FR-NAV-003, profile.md, mobile layout on every width until #22
// turns the sections into forms).
export function SettingsMenu({ profile, households, signOut }: SettingsMenuProps) {
  const t = useTranslations("Settings");
  const tHouseholds = useTranslations("Households");
  return (
    <div className="flex w-full max-w-content-width flex-col gap-4">
      <Section id="settings-account" title={t("account")}>
        <div className="flex items-center gap-3">
          <Avatar name={profile.displayName} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-strong text-text">{profile.displayName}</span>
            {profile.email && (
              <span className="truncate text-small text-text-secondary">{profile.email}</span>
            )}
          </div>
          <IconButton
            icon={Pencil}
            label={t("editProfile")}
            href={settingsPaths.account}
            tooltipAlign="end"
          />
        </div>
      </Section>

      <Section id="settings-household" title={t("household")}>
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

      <Section id="settings-preferences" title={t("preferences")}>
        <ul className="flex flex-col">
          <li>
            {/* The theme follows the device until #22 lets people choose it. */}
            <Row
              href={settingsPaths.appearance}
              label={t("appearance")}
              value={t("theme.system")}
            />
          </li>
          <li>
            <Row href={settingsPaths.notifications} label={t("notifications")} />
          </li>
        </ul>
      </Section>

      <Section id="settings-privacy" title={t("privacy")}>
        <ul className="flex flex-col">
          <li>
            <Row href={settingsPaths.downloadData} label={t("download")} icon={Download} />
          </li>
          <li>
            <Row href={settingsPaths.deleteAccount} label={t("delete")} icon={Trash2} danger />
          </li>
        </ul>
      </Section>

      {signOut}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={id}>
      <h2 id={id} className="text-subtitle text-text">
        {title}
      </h2>
      {children}
    </Card>
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

function Row({ href, label, detail, value, icon: Icon, danger = false }: RowProps) {
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
