import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { IconButton } from "@/design-system";
import { OwnAvatar } from "@/features/profile";
import type { Locale } from "@/lib/i18n/locales";
import type { Theme } from "@/lib/theme/theme";
import { settingsPaths } from "../domain/sections";
import {
  HouseholdSection,
  PrivacyRows,
  Row,
  Section,
  type SettingsHousehold,
} from "./settings-sections";

type SettingsMenuProps = {
  profile: { displayName: string; email: string; avatarUrl: string | null; theme: Theme };
  households: readonly SettingsHousehold[];
  locale: Locale;
  // The sign-out form, from the auth feature.
  signOut: ReactNode;
  // From the account feature.
  deleteAccount: ReactNode;
};

// The profile and settings menu of phones (FR-NAV-003, profile.md): each row opens its own page.
// Wider screens get SettingsCards instead.
export function SettingsMenu({
  profile,
  households,
  locale,
  signOut,
  deleteAccount,
}: SettingsMenuProps) {
  const t = useTranslations("Settings");
  const tLanguage = useTranslations("Profile.language");
  return (
    <div className="flex w-full flex-col gap-4 md:hidden">
      <Section id="settings-account" title={t("account")}>
        <div className="flex items-center gap-3">
          <OwnAvatar name={profile.displayName} src={profile.avatarUrl} size="lg" />
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

      <HouseholdSection id="settings-household" households={households} />

      <Section id="settings-preferences" title={t("preferences")}>
        <ul className="flex flex-col">
          <li>
            <Row
              href={settingsPaths.appearance}
              label={t("appearance")}
              value={t(`theme.${profile.theme}`)}
            />
          </li>
          <li>
            <Row href={settingsPaths.language} label={t("language")} value={tLanguage(locale)} />
          </li>
          <li>
            <Row href={settingsPaths.notifications} label={t("notifications")} />
          </li>
        </ul>
      </Section>

      <Section id="settings-privacy" title={t("privacy")}>
        <PrivacyRows deleteAccount={deleteAccount} />
      </Section>

      {signOut}
    </div>
  );
}
