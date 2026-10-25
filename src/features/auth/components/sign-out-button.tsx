import { useTranslations } from "next-intl";
import { Button } from "@/design-system";
import { signOutAction } from "../actions";

// Temporary home on the Home page; #21 moves it into settings.
export function SignOutButton() {
  const t = useTranslations("Home");
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary">
        {t("signOut")}
      </Button>
    </form>
  );
}
