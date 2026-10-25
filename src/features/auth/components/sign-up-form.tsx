"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState, type FormEvent } from "react";
import { Button, FormMessage, PasswordField, TextField } from "@/design-system";
import { signUpAction, type AuthFormState } from "../actions";
import { fieldErrors, passwordMinLength, signUpSchema, type ValidationKey } from "../schemas";
import { BackToSignIn } from "./back-to-sign-in";
import { useFormFocus } from "./use-form-focus";

const initialState: AuthFormState = { status: "idle" };

type SignUpFormProps = {
  // The name and address from a sign-up made a moment ago, when "Use a different email" on Check
  // your inbox brings the user back. The password is never kept.
  defaults?: { displayName: string; email: string };
};

export function SignUpForm({ defaults }: SignUpFormProps) {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(signUpAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const { formRef, messageRef } = useFormFocus(errors, state.status === "failed");
  const values = state.values ?? defaults;

  // The same schema as the server, so most mistakes show up without a round trip.
  function validate(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = signUpSchema.safeParse(Object.fromEntries(data));
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
    const timeZone = form.elements.namedItem("timeZone");
    if (timeZone instanceof HTMLInputElement) {
      timeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }

  const fieldError = (name: string) => {
    const key = errors?.[name];
    return key ? t(`validation.${key}`, { min: passwordMinLength }) : undefined;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6 lg:pt-0">
      <BackToSignIn />
      <div className="flex flex-col gap-2">
        <h1 className="text-heading text-text">{t("signUp.title")}</h1>
        <p className="text-body text-text-secondary">{t("signUp.lede")}</p>
      </div>
      <div className="flex flex-col gap-4">
        {state.status === "failed" && state.error && (
          <FormMessage ref={messageRef} tone="danger">
            {state.error === "generic" ? t("signUp.failed") : t(`errors.${state.error}`)}
          </FormMessage>
        )}
        <form
          ref={formRef}
          action={action}
          onSubmit={validate}
          noValidate
          aria-label={t("signUp.submit")}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="timeZone" />
          <TextField
            label={t("signUp.displayName")}
            name="displayName"
            autoComplete="given-name"
            defaultValue={values?.displayName}
            error={fieldError("displayName")}
            required
          />
          <TextField
            label={t("signUp.email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t("emailPlaceholder")}
            defaultValue={values?.email}
            error={fieldError("email")}
            required
          />
          <PasswordField
            label={t("signUp.password")}
            name="password"
            autoComplete="new-password"
            help={t("signUp.passwordHelp", { min: passwordMinLength })}
            showLabel={t("showPassword")}
            error={fieldError("password")}
            required
          />
          <PasswordField
            label={t("signUp.confirmPassword")}
            name="confirmPassword"
            autoComplete="new-password"
            showLabel={t("showPassword")}
            error={fieldError("confirmPassword")}
            required
          />
          <Button type="submit" pending={pending} pendingLabel={t("signUp.submitting")}>
            {t("signUp.submit")}
          </Button>
        </form>
      </div>
      {/* At the bottom of the screen on phones, right under the button on desktop. */}
      <p className="mt-auto text-center text-small text-text-secondary lg:mt-0">
        {t("signUp.confirmNote")}
      </p>
    </div>
  );
}
