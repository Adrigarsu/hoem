"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { Button, FormMessage, PasswordField, TextField } from "@/design-system";
import { signUpAction, type AuthFormState } from "../actions";
import { fieldErrors, passwordMinLength, signUpSchema, type ValidationKey } from "../schemas";
import { ResendForm } from "./resend-form";
import { useFormFocus } from "./use-form-focus";

const initialState: AuthFormState = { status: "idle" };

export function SignUpForm() {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(signUpAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const { formRef, messageRef } = useFormFocus(errors, state.status === "failed");

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

  if (state.status === "sent" && state.values?.email) {
    return (
      <section aria-labelledby="check-email-title" className="flex flex-col gap-4">
        <h1 id="check-email-title" className="text-title text-text">
          {t("checkEmail.title")}
        </h1>
        <p className="text-body text-text-secondary">
          {t("checkEmail.body", { email: state.values.email })}
        </p>
        <ResendForm email={state.values.email} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-title text-text">{t("signUp.title")}</h1>
        <p className="text-body text-text-secondary">{t("signUp.intro")}</p>
      </div>
      {state.status === "failed" && state.error && (
        <FormMessage ref={messageRef} tone="danger">
          {t(`errors.${state.error}`)}
        </FormMessage>
      )}
      <form
        ref={formRef}
        action={action}
        onSubmit={validate}
        noValidate
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="timeZone" />
        <TextField
          label={t("signUp.displayName")}
          name="displayName"
          autoComplete="name"
          help={t("signUp.displayNameHelp")}
          defaultValue={state.values?.displayName}
          error={fieldError("displayName")}
          required
        />
        <TextField
          label={t("signUp.email")}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
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
        <Button type="submit" pending={pending}>
          {t("signUp.submit")}
        </Button>
      </form>
      <p className="text-small text-text-secondary">
        {t("signUp.haveAccount")}{" "}
        <Link href="/sign-in" className="font-semibold text-brand underline underline-offset-4">
          {t("signUp.signInLink")}
        </Link>
      </p>
    </div>
  );
}
