"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState, type FormEvent } from "react";
import { Button, FormMessage, PasswordField, TextField } from "@/design-system";
import { signInAction, type AuthFormState } from "../actions";
import type { AuthErrorKey } from "../domain/auth-errors";
import { fieldErrors, signInSchema, type ValidationKey } from "../schemas";
import { ResendForm } from "./resend-form";
import { useFormFocus } from "./use-form-focus";

const initialState: AuthFormState = { status: "idle" };

// Errors the e-mail verification route can send back in ?error=; anything else is ignored.
const linkErrors: readonly AuthErrorKey[] = ["linkExpired", "generic"];

export function SignInForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(signInAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;

  const linkError = linkErrors.find((key) => key === searchParams.get("error"));
  const formError =
    state.status === "failed" ? state.error : state.status === "idle" ? linkError : undefined;
  const { formRef, messageRef } = useFormFocus(errors, Boolean(formError));

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title text-text">{t("signIn.title")}</h1>
      {formError && (
        <FormMessage
          ref={messageRef}
          tone="danger"
          action={
            formError === "emailNotConfirmed" && state.values?.email ? (
              <ResendForm email={state.values.email} />
            ) : undefined
          }
        >
          {t(`errors.${formError}`)}
        </FormMessage>
      )}
      <form
        ref={formRef}
        action={action}
        onSubmit={validate}
        noValidate
        className="flex flex-col gap-4"
      >
        {/* The page to return to; the action only follows paths inside the app. */}
        <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
        <TextField
          label={t("signIn.email")}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          error={fieldError("email")}
          required
        />
        <PasswordField
          label={t("signIn.password")}
          name="password"
          autoComplete="current-password"
          showLabel={t("showPassword")}
          error={fieldError("password")}
          required
        />
        <Button type="submit" pending={pending}>
          {t("signIn.submit")}
        </Button>
      </form>
      <p className="text-small text-text-secondary">
        {t("signIn.noAccount")}{" "}
        <Link href="/sign-up" className="font-semibold text-brand underline underline-offset-4">
          {t("signIn.signUpLink")}
        </Link>
      </p>
    </div>
  );
}
