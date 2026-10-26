"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, buttonClassName, FormMessage, PasswordField } from "@/design-system";
import { resetPasswordAction, type AuthFormState } from "../actions";
import {
  fieldErrors,
  passwordMinLength,
  resetPasswordSchema,
  type ValidationKey,
} from "../schemas";
import { BackToSignIn } from "./back-to-sign-in";
import { useFormFocus } from "./use-form-focus";

const initialState: AuthFormState = { status: "idle" };

// Opened from the reset e-mail. The token is only sent with the form: verifying it on page load
// would let mail scanners, which open links, use it up (decided in #24).
export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const tokenHash = useSearchParams().get("token_hash") ?? "";
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const expired = !tokenHash || (state.status === "failed" && state.error === "linkExpired");
  const formError = state.status === "failed" && !expired ? state.error : undefined;
  const { formRef, messageRef } = useFormFocus(errors, Boolean(formError));
  const expiredHeadingRef = useRef<HTMLHeadingElement>(null);
  const expiredOnSubmit = expired && state.status === "failed";

  useEffect(() => {
    if (expiredOnSubmit) expiredHeadingRef.current?.focus();
  }, [expiredOnSubmit]);

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = resetPasswordSchema.safeParse(
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
    return key ? t(`validation.${key}`, { min: passwordMinLength }) : undefined;
  };

  if (expired) {
    return (
      <div className="flex flex-1 flex-col gap-6 pt-6 lg:pt-0">
        <BackToSignIn />
        <div className="flex flex-col gap-4">
          <h1 ref={expiredHeadingRef} tabIndex={-1} className="text-heading text-text">
            {t("resetPassword.expiredTitle")}
          </h1>
          <p className="text-body text-text-secondary">{t("resetPassword.expired")}</p>
        </div>
        <Link href="/forgot-password?error=linkExpired" className={buttonClassName("primary")}>
          {t("resetPassword.askAgain")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6 lg:pt-0">
      <BackToSignIn />
      <div className="flex flex-col gap-2">
        <h1 className="text-heading text-text">{t("resetPassword.title")}</h1>
        <p className="text-body text-text-secondary">{t("resetPassword.lede")}</p>
      </div>
      <form
        ref={formRef}
        action={action}
        onSubmit={validate}
        noValidate
        aria-label={t("resetPassword.title")}
        className="flex flex-col gap-4"
      >
        {formError && (
          <FormMessage ref={messageRef} tone="danger">
            {t(`errors.${formError}`)}
          </FormMessage>
        )}
        <input type="hidden" name="tokenHash" value={tokenHash} />
        <PasswordField
          label={t("resetPassword.password")}
          name="password"
          autoComplete="new-password"
          help={t("resetPassword.passwordHelp", { min: passwordMinLength })}
          showLabel={t("showPassword")}
          error={fieldError("password")}
          required
        />
        <PasswordField
          label={t("resetPassword.confirmPassword")}
          name="confirmPassword"
          autoComplete="new-password"
          showLabel={t("showPassword")}
          error={fieldError("confirmPassword")}
          required
        />
        <Button type="submit" pending={pending} pendingLabel={t("resetPassword.submitting")}>
          {t("resetPassword.submit")}
        </Button>
      </form>
    </div>
  );
}
