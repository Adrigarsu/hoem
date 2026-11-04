"use client";

import { useTranslations } from "next-intl";
import { Button, commitWaitingUndos } from "@/design-system";
import { signOutAction } from "../actions";

// A delete still inside its 5-second undo is committed first: once the session ends the server
// refuses it, and what the user deleted would stay (ADR-009).
async function signOut() {
  await commitWaitingUndos();
  await signOutAction();
}

// Last in the profile and settings menu (FR-NAV-003), full width as in profile.md.
export function SignOutButton() {
  const t = useTranslations("Auth");
  return (
    <form action={signOut}>
      <Button type="submit" variant="secondary" className="w-full">
        {t("signOut")}
      </Button>
    </form>
  );
}
