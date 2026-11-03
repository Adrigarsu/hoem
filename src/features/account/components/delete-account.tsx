"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { Button, Dialog, FormMessage, TextField, useFormFocus } from "@/design-system";
import { deleteAccountAction, type DeleteAccountState } from "../actions";
import type { BlockingLink } from "../blocking-links";
import { confirmsDeletion } from "../domain/account-deletion";
import { deleteAccountSchema, fieldErrors, type ValidationKey } from "../schemas";

const idle: DeleteAccountState = { status: "idle" };

type DeleteAccountProps = {
  email: string;
  // The households that need a new owner first, known when the page loads.
  blockers: readonly BlockingLink[];
};

// Delete account (FR-ACC-007, profile.md): a row that opens a dialog. Each time the dialog closes it
// starts again, so nothing typed and no earlier error stays behind.
export function DeleteAccount({ email, blockers }: DeleteAccountProps) {
  const t = useTranslations("Settings");
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <div className="-mx-3">
      {/* Each tone keeps an approved colour pair on hover too: danger-ink on danger-tint. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-control-height w-full items-center gap-3 rounded-md px-3 py-2 text-left text-danger hover:bg-danger-tint hover:text-danger-ink"
      >
        <Trash2 aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        <span className="text-body-strong">{t("delete")}</span>
      </button>
      <DeleteAccountDialog
        key={attempt}
        open={open}
        email={email}
        blockers={blockers}
        onCancel={() => setOpen(false)}
        onClosed={() => {
          setOpen(false);
          setAttempt(attempt + 1);
        }}
      />
    </div>
  );
}

type DialogProps = DeleteAccountProps & {
  open: boolean;
  onCancel: () => void;
  onClosed: () => void;
};

function DeleteAccountDialog({ open, email, blockers, onCancel, onClosed }: DialogProps) {
  const t = useTranslations("Account");
  const [state, action, pending] = useActionState(deleteAccountAction, idle);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const { formRef, messageRef } = useFormFocus(
    errors,
    state.status === "failed" || state.status === "blocked",
  );

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = deleteAccountSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    const problems = result.success
      ? confirmsDeletion(result.data.confirmation, email)
        ? undefined
        : ({ confirmation: "wrongEmail" } as const)
      : fieldErrors(result.error);
    setClientErrors(problems);
    if (problems) event.preventDefault();
  }

  if (state.status === "blocked" || blockers.length > 0) {
    const households = state.households?.length ? state.households : blockers;
    return (
      <Dialog
        open={open}
        onClose={onClosed}
        role="alertdialog"
        title={t("blocked.title")}
        description={
          <div ref={messageRef} tabIndex={-1} className="flex flex-col gap-3">
            <p>{t("blocked.lede")}</p>
            {households.length > 0 && (
              <ul className="flex flex-col gap-1">
                {households.map((household) => (
                  <li key={household.href}>
                    <Link href={household.href} className="text-brand underline underline-offset-4">
                      {household.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
        actions={<Button onClick={onCancel}>{t("blocked.close")}</Button>}
      />
    );
  }

  const error = errors?.confirmation ? t(`validation.${errors.confirmation}`) : undefined;

  return (
    <form ref={formRef} action={action} onSubmit={validate} noValidate>
      <Dialog
        open={open}
        onClose={onClosed}
        title={t("title")}
        description={
          <>
            <p>{t("lede")}</p>
            <p>{t("prompt", { email })}</p>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="danger" pending={pending} pendingLabel={t("deleting")}>
              <Trash2 aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
              {t("confirm")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {state.status === "failed" && (
            <FormMessage ref={messageRef} tone="danger">
              {t("failed")}
            </FormMessage>
          )}
          <TextField
            label={t("field")}
            name="confirmation"
            type="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.values?.confirmation}
            error={error}
          />
        </div>
      </Dialog>
    </form>
  );
}
