"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useId, useState, type FormEvent, type ReactNode } from "react";
import { Button, FormMessage, Logo, PasswordField, TextField } from "@/design-system";
import { resendFromSignInAction, signInAction, type AuthFormState } from "../actions";
import type { AuthErrorKey } from "../domain/auth-errors";
import { fieldErrors, signInSchema, type ValidationKey } from "../schemas";
import { useFormFocus } from "./use-form-focus";

const initialState: AuthFormState = { status: "idle" };

// Errors the e-mail verification route can send back in ?error=; anything else is ignored.
const linkErrors: readonly AuthErrorKey[] = ["linkExpired", "generic"];

function signUpLink(chunks: ReactNode) {
  return (
    <Link href="/sign-up" className="font-semibold text-brand underline underline-offset-4">
      {chunks}
    </Link>
  );
}

// On phones the page opens with the brand (logo, tagline as h1); on desktop the brand panel takes
// that role and the column starts with "Sign in" (sign-in.md). Only one of the two h1 is ever
// displayed, so the page always has exactly one.
export function SignInForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const resendFormId = useId();
  const [state, action, pending] = useActionState(signInAction, initialState);
  const [resendState, resendAction, resending] = useActionState(
    resendFromSignInAction,
    initialState,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;

  const linkError = linkErrors.find((key) => key === searchParams.get("error"));
  const formError =
    state.status === "failed" ? state.error : state.status === "idle" ? linkError : undefined;
  const { formRef, messageRef } = useFormFocus(errors, Boolean(formError));
  const unverifiedEmail = formError === "emailNotConfirmed" ? state.values?.email : undefined;

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
    <div className="flex flex-1 flex-col gap-8 pt-16 lg:gap-6 lg:pt-0">
      <div className="flex flex-col gap-4 lg:hidden">
        <Logo label={t("brand")} />
        <h1 className="text-heading text-text">{t("signIn.tagline")}</h1>
        <p className="text-body text-text-secondary">{t("signIn.lede")}</p>
      </div>
      <div className="hidden flex-col gap-2 lg:flex">
        <h1 className="text-heading text-text">{t("signIn.title")}</h1>
        <p className="text-body text-text-secondary">
          {t.rich("signIn.noAccount", { link: signUpLink })}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {unverifiedEmail ? (
          <FormMessage ref={messageRef} tone="warning">
            {t("signIn.unverified", { email: unverifiedEmail })}{" "}
            {/* A sentence-inline link in the screen; a button tied to the form below, because a
                form cannot sit inside the message's paragraph. */}
            <button
              type="submit"
              form={resendFormId}
              aria-busy={resending || undefined}
              className="font-semibold underline underline-offset-4"
            >
              {t("signIn.resend")}
            </button>
          </FormMessage>
        ) : (
          formError && (
            <FormMessage ref={messageRef} tone="danger">
              {t(`errors.${formError}`)}
            </FormMessage>
          )
        )}
        {resendState.status === "failed" && resendState.error && (
          <FormMessage tone="danger">{t(`errors.${resendState.error}`)}</FormMessage>
        )}
        {unverifiedEmail && (
          <form id={resendFormId} action={resendAction} hidden>
            <input type="hidden" name="email" value={unverifiedEmail} />
          </form>
        )}
        <form
          ref={formRef}
          action={action}
          onSubmit={validate}
          noValidate
          aria-label={t("signIn.title")}
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
            placeholder={t("emailPlaceholder")}
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
          <Button type="submit" pending={pending} pendingLabel={t("signIn.submitting")}>
            {t("signIn.submit")}
          </Button>
          <p className="text-center text-small text-text-secondary lg:hidden">
            {t.rich("signIn.noAccount", { link: signUpLink })}
          </p>
        </form>
      </div>
    </div>
  );
}
