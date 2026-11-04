"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { Button, buttonClassName, FormMessage, TextField, useFormFocus } from "@/design-system";
import { changeEmailAction, type AuthFormState } from "../actions";
import type { LinkFailure } from "../domain/verification-link";
import { changeEmailSchema, fieldErrors, type ValidationKey } from "../schemas";
import type { Account } from "../service";

type EmailFormProps = {
  account: Account;
  // Where "Change password" goes: the settings feature owns the paths.
  passwordHref: string;
  // Set when the confirmation link failed and sent the user back here (?error=).
  linkError?: LinkFailure;
};

const initialState: AuthFormState = { status: "idle" };

// The Email field of Account settings (FR-ACC-007, profile.md). The address only changes once the
// link sent to the new one is opened, so until then the field keeps the current one.
export function EmailForm({ account, passwordHref, linkError }: EmailFormProps) {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(changeEmailAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const formError = state.status === "failed" && !pending ? state.error : undefined;
  const { formRef, messageRef } = useFormFocus(errors, Boolean(formError));
  const sentTo = state.status === "sent" ? state.values?.email : undefined;

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = changeEmailSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
  }

  function status() {
    if (pending || clientErrors) return null;
    if (sentTo) return t("changeEmail.sent", { email: sentTo });
    if (account.pendingEmail) return t("changeEmail.pending", { email: account.pendingEmail });
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        ref={formRef}
        action={action}
        onSubmit={validate}
        noValidate
        className="flex flex-col gap-3"
      >
        {formError && (
          <FormMessage ref={messageRef} tone="danger">
            {t(`errors.${formError}`)}
          </FormMessage>
        )}
        {/* Until the next attempt, which replaces it with its own answer. */}
        {linkError && state.status === "idle" && (
          <FormMessage tone="danger">
            {linkError === "linkExpired"
              ? t("changeEmail.linkExpired")
              : t("changeEmail.linkFailed")}
          </FormMessage>
        )}
        <TextField
          label={t("changeEmail.label")}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={sentTo ? account.email : (state.values?.email ?? account.email)}
          error={errors?.email ? t(`validation.${errors.email}`) : undefined}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {/* In the page from the start, so a screen reader announces the change of text. */}
          <p role="status" className="text-small text-text-secondary">
            {status()}
          </p>
          <Button
            type="submit"
            variant="secondary"
            pending={pending}
            pendingLabel={t("changeEmail.submitting")}
          >
            {t("changeEmail.submit")}
          </Button>
        </div>
      </form>
      <Link href={passwordHref} className={`${buttonClassName("ghost")} self-start`}>
        {account.hasPassword ? t("changeEmail.changePassword") : t("changeEmail.setPassword")}
      </Link>
    </div>
  );
}
