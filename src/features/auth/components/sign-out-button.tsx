import { useTranslations } from "next-intl";
import { Button } from "@/design-system";
import { signOutAction } from "../actions";

// On the settings page until #21 builds the profile and settings menu.
export function SignOutButton() {
  const t = useTranslations("Auth");
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary">
        {t("signOut")}
      </Button>
    </form>
  );
}
