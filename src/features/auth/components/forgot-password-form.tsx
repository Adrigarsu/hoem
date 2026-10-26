"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, FormMessage, IconTile, Note, TextField } from "@/design-system";
import { requestPasswordResetAction, type AuthFormState } from "../actions";
import { fieldErrors, forgotPasswordSchema, type ValidationKey } from "../schemas";
import { BackToSignIn } from "./back-to-sign-in";
import { useFormFocus } from "./use-form-focus";

const initialState: AuthFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  // "Try a different email" hides this answer; the next request brings a new one, so the sent
  // screen only comes back with the address that request used.
  const [dismissed, setDismissed] = useState<AuthFormState>();
  const errors = clientErrors ?? state.fieldErrors;
  const formError = state.status === "failed" ? state.error : undefined;
  const { formRef, messageRef } = useFormFocus(errors, Boolean(formError));
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  const sent = state.status === "sent" && state !== dismissed;
  // Arriving from a reset link that no longer works: the reset page's expired state links here.
  const linkExpired = state.status === "idle" && searchParams.get("error") === "linkExpired";

  // The new state replaces the form, so screen readers are taken to its heading.
  useEffect(() => {
    if (sent) sentHeadingRef.current?.focus();
  }, [sent]);

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = forgotPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
  }

  const fieldError = (name: string) => {
    const key = errors?.[name];
    return key ? t(`validation.${key}`, { min: 0 }) : undefined;
  };

  if (sent) {
    return (
      <div className="flex flex-1 flex-col gap-6 pt-6 lg:pt-0">
        <BackToSignIn />
        <div className="flex flex-col gap-4">
          <IconTile icon={Mail} />
          <h1 ref={sentHeadingRef} tabIndex={-1} className="text-heading text-text">
            {t("forgotPassword.sentTitle")}
          </h1>
          <p className="text-body text-text-secondary">
            {t.rich("forgotPassword.sent", {
              email: state.values?.email ?? "",
              strong: (chunks) => <strong className="font-semibold text-text">{chunks}</strong>,
            })}
          </p>
        </div>
        <Note>{t("forgotPassword.note")}</Note>
        <p className="text-center text-small text-text-secondary">
          {t.rich("forgotPassword.wrongAddress", {
            link: (chunks) => (
              <button
                type="button"
                onClick={() => setDismissed(state)}
                className="font-semibold text-brand underline underline-offset-4"
              >
                {chunks}
              </button>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6 lg:pt-0">
      <BackToSignIn />
      <div className="flex flex-col gap-2">
        <h1 className="text-heading text-text">{t("forgotPassword.title")}</h1>
        <p className="text-body text-text-secondary">{t("forgotPassword.lede")}</p>
      </div>
      <form
        ref={formRef}
        action={action}
        onSubmit={validate}
        noValidate
        aria-label={t("forgotPassword.title")}
        className="flex flex-col gap-4"
      >
        {linkExpired && <FormMessage tone="warning">{t("forgotPassword.linkExpired")}</FormMessage>}
        {formError && (
          <FormMessage ref={messageRef} tone="danger">
            {t(`errors.${formError}`)}
          </FormMessage>
        )}
        <TextField
          label={t("forgotPassword.email")}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("emailPlaceholder")}
          defaultValue={state.values?.email}
          error={fieldError("email")}
          required
        />
        <Button type="submit" pending={pending} pendingLabel={t("forgotPassword.submitting")}>
          {t("forgotPassword.submit")}
        </Button>
      </form>
    </div>
  );
}
