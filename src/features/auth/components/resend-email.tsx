"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId, type MouseEvent } from "react";
import { Button, FormMessage } from "@/design-system";
import { resendFromInboxAction, type AuthFormState } from "../actions";
import { useCooldown } from "./use-cooldown";

const cooldownSeconds = 60;

// "Resend email" on Check your inbox. After a new link it waits a minute: the button stays
// focusable (aria-disabled, not disabled) and the countdown is linked to it, but not announced
// every second; only the "sent" status is.
export function ResendEmail() {
  const t = useTranslations("Auth.checkInbox");
  const waitId = useId();
  const { secondsLeft, start } = useCooldown(cooldownSeconds);
  const [state, action, pending] = useActionState(
    async (): Promise<AuthFormState> => {
      const result = await resendFromInboxAction();
      if (result.status === "resent") start();
      return result;
    },
    { status: "idle" },
  );
  const waiting = secondsLeft > 0;

  function holdWhileWaiting(event: MouseEvent<HTMLButtonElement>) {
    if (waiting) event.preventDefault();
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      {state.status === "resent" && <FormMessage tone="success">{t("resent")}</FormMessage>}
      {state.status === "failed" && <FormMessage tone="danger">{t("failed")}</FormMessage>}
      <Button
        type="submit"
        variant="secondary"
        pending={pending}
        pendingLabel={t("sending")}
        aria-disabled={waiting || pending || undefined}
        aria-describedby={waiting ? waitId : undefined}
        onClick={holdWhileWaiting}
        className="aria-disabled:border-border aria-disabled:bg-surface-subtle aria-disabled:text-text-muted"
      >
        {t("resend")}
      </Button>
      {waiting && (
        <p id={waitId} className="text-center text-small text-text-secondary">
          {t("wait", { seconds: secondsLeft })}
        </p>
      )}
    </form>
  );
}
