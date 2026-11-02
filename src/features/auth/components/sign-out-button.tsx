import { useTranslations } from "next-intl";
import { Button } from "@/design-system";
import { signOutAction } from "../actions";

// Last in the profile and settings menu (FR-NAV-003), full width as in profile.md.
export function SignOutButton() {
  const t = useTranslations("Auth");
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary" className="w-full">
        {t("signOut")}
      </Button>
    </form>
  );
}
