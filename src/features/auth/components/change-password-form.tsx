"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState, type FormEvent } from "react";
import { Button, FormMessage, PasswordField, useFormFocus } from "@/design-system";
import { changePasswordAction, type AuthFormState } from "../actions";
import {
  changePasswordSchema,
  fieldErrors,
  passwordMinLength,
  requireCurrentPassword,
  type ValidationKey,
} from "../schemas";
import type { Account } from "../service";

const initialState: AuthFormState = { status: "idle" };

// A wrong current password belongs next to that field, not at the top of the form. Listing it as a
// field error moves focus there; one object for every render, so focus moves only when it changes.
const wrongPasswordErrors: Record<string, ValidationKey> = { currentPassword: "required" };

// Change password, or Set a password for an account created with Google (FR-ACC-007). Signed in,
// unlike the reset form: an account with a password proves it first (see the service).
export function ChangePasswordForm({ account }: { account: Account }) {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const wrongPassword = state.status === "failed" && state.error === "wrongPassword";
  const errors = clientErrors ?? (wrongPassword ? wrongPasswordErrors : state.fieldErrors);
  const formError = state.status === "failed" && !wrongPassword ? state.error : undefined;
  const { formRef, messageRef } = useFormFocus(errors, Boolean(formError));
  const schema = account.hasPassword ? requireCurrentPassword : changePasswordSchema;

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
  }

  const fieldError = (name: string) => {
    if (name === "currentPassword" && wrongPassword && !clientErrors) {
      return t("errors.wrongPassword");
    }
    const key = errors?.[name];
    return key ? t(`validation.${key}`, { min: passwordMinLength }) : undefined;
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-text-secondary">
        {account.hasPassword ? t("changePassword.lede") : t("changePassword.setLede")}
      </p>
      <form
        ref={formRef}
        action={action}
        onSubmit={validate}
        noValidate
        className="flex flex-col gap-4"
      >
        {formError && (
          <FormMessage ref={messageRef} tone="danger">
            {t(`errors.${formError}`)}
          </FormMessage>
        )}
        {state.status === "changed" && !pending && (
          <FormMessage tone="success">{t("changePassword.changed")}</FormMessage>
        )}
        {/* So password managers save the new password for the right account. */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={account.email}
          readOnly
          hidden
        />
        {account.hasPassword && (
          <PasswordField
            label={t("changePassword.currentPassword")}
            name="currentPassword"
            autoComplete="current-password"
            showLabel={t("showPassword")}
            error={fieldError("currentPassword")}
            required
          />
        )}
        <PasswordField
          label={t("changePassword.password")}
          name="password"
          autoComplete="new-password"
          help={t("changePassword.passwordHelp", { min: passwordMinLength })}
          showLabel={t("showPassword")}
          error={fieldError("password")}
          required
        />
        <PasswordField
          label={t("changePassword.confirmPassword")}
          name="confirmPassword"
          autoComplete="new-password"
          showLabel={t("showPassword")}
          error={fieldError("confirmPassword")}
          required
        />
        <Button
          type="submit"
          pending={pending}
          pendingLabel={t("changePassword.submitting")}
          className="self-start"
        >
          {t("changePassword.submit")}
        </Button>
      </form>
    </div>
  );
}
