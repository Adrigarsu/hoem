import { useTranslations } from "next-intl";
import { SelectField } from "@/design-system";
import { supportedLocales, type Locale } from "@/lib/i18n/locales";

// English is the only language of the MVP (ADR-012), so there is nothing to save yet. Adding "es"
// to supportedLocales adds the option; that issue also saves the choice and the hoem-locale cookie.
export function LanguageField({ locale }: { locale: Locale }) {
  const t = useTranslations("Profile.language");
  return (
    <SelectField
      label={t("label")}
      defaultValue={locale}
      options={supportedLocales.map((value) => ({ value, label: t(value) }))}
    />
  );
}
