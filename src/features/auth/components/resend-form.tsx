"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, FormMessage } from "@/design-system";
import { resendVerificationAction, type AuthFormState } from "../actions";

// "Send the link again", for the check-your-inbox screen and for an unverified sign-in.
export function ResendForm({ email }: { email: string }) {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(resendVerificationAction, {
    status: "idle",
  } satisfies AuthFormState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="secondary" pending={pending}>
        {t("checkEmail.resend")}
      </Button>
      {state.status === "resent" && (
        <FormMessage tone="success">{t("checkEmail.resent")}</FormMessage>
      )}
      {state.status === "failed" && state.error && (
        <FormMessage tone="danger">{t(`errors.${state.error}`)}</FormMessage>
      )}
    </form>
  );
}
