import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { settingsPaths } from "../domain/sections";
import {
  HouseholdSection,
  PrivacyRows,
  Row,
  Section,
  type SettingsHousehold,
} from "./settings-sections";

type SettingsCardsProps = {
  households: readonly SettingsHousehold[];
  // The forms and the sign-out button, from the features that own them.
  account: ReactNode;
  theme: ReactNode;
  language: ReactNode;
  signOut: ReactNode;
};

// Profile and settings on wider screens (FR-NAV-003, FR-ACC-007, profile.md): the forms are right
// here, in one column on tablets and two on desktops. Phones get SettingsMenu instead.
export function SettingsCards({
  households,
  account,
  theme,
  language,
  signOut,
}: SettingsCardsProps) {
  const t = useTranslations("Settings");
  return (
    <div className="hidden w-full items-start gap-4 md:grid lg:grid-cols-2">
      <Section id="settings-cards-account" title={t("account")}>
        {account}
      </Section>

      <Section id="settings-cards-preferences" title={t("preferences")}>
        <div className="flex flex-col gap-4">
          {theme}
          {language}
          {/* Its switches come with push notifications (M5); until then it opens "Coming soon". */}
          <Row href={settingsPaths.notifications} label={t("notifications")} />
        </div>
      </Section>

      <HouseholdSection id="settings-cards-household" households={households} />

      <Section id="settings-cards-privacy" title={t("privacy")}>
        <PrivacyRows />
        {signOut}
      </Section>
    </div>
  );
}
