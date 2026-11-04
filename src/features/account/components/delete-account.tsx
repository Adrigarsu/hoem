"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  createContext,
  use,
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button, Dialog, FormMessage, TextField, useFormFocus } from "@/design-system";
import { deleteAccountAction, type DeleteAccountState } from "../actions";
import type { BlockingLink } from "../blocking-links";
import { confirmsDeletion } from "../domain/account-deletion";
import { deleteAccountSchema, fieldErrors, type ValidationKey } from "../schemas";

const idle: DeleteAccountState = { status: "idle" };

const OpenDeleteAccount = createContext<(() => void) | null>(null);

// Which texts the refusal uses. A refusal the page did not foresee comes without households, so it
// names both reasons.
function refusalKind(households: readonly BlockingLink[]): "owner" | "parent" | "both" {
  const reasons = new Set(households.flatMap((household) => household.reasons));
  if (reasons.size === 1) return reasons.has("owner") ? "owner" : "parent";
  return "both";
}

type DeleteAccountProps = {
  email: string;
  // The households that need a new owner first, known when the page loads.
  blockers: readonly BlockingLink[];
};

// Delete account (FR-ACC-007, profile.md). /settings holds one block per width, each with its own
// DeleteAccountButton, but there is a single dialog, outside both blocks: a modal inside a block
// that turning the phone hides would leave the page inert, and a second form would repeat the
// e-mail field. Each time the dialog closes it starts again, so nothing typed and no earlier error
// stays behind.
export function DeleteAccountProvider({
  email,
  blockers,
  children,
}: DeleteAccountProps & { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <OpenDeleteAccount value={() => setOpen(true)}>
      {children}
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
    </OpenDeleteAccount>
  );
}

// The row in Privacy and data. The browser gives focus back to it when the dialog closes.
export function DeleteAccountButton() {
  const t = useTranslations("Settings");
  const openDialog = use(OpenDeleteAccount);
  if (!openDialog) throw new Error("DeleteAccountButton must be inside DeleteAccountProvider");

  return (
    <div className="-mx-3">
      {/* Each tone keeps an approved colour pair on hover too: danger-ink on danger-tint. */}
      <button
        type="button"
        onClick={openDialog}
        className="flex min-h-control-height w-full items-center gap-3 rounded-md px-3 py-2 text-left text-danger hover:bg-danger-tint hover:text-danger-ink"
      >
        <Trash2 aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        <span className="text-body-strong">{t("delete")}</span>
      </button>
    </div>
  );
}

type DialogProps = DeleteAccountProps & {
  open: boolean;
  onCancel: () => void;
  onClosed: () => void;
};

// One <dialog> whatever it shows: a refusal from the server swaps its content, never the element,
// so the modal stays open and focus moves to the explanation.
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

  const blocked = state.status === "blocked" || blockers.length > 0;
  const households = state.households?.length ? state.households : blockers;
  const kind = refusalKind(households);
  const error = errors?.confirmation ? t(`validation.${errors.confirmation}`) : undefined;

  return (
    // No box of its own: it sits in the page's flex column, where it would add a gap.
    <form ref={formRef} action={action} onSubmit={validate} noValidate className="contents">
      <Dialog
        open={open}
        onClose={onClosed}
        role={blocked ? "alertdialog" : "dialog"}
        // Closing would look like cancelling, but the server is already deleting the account.
        dismissible={!pending}
        title={blocked ? t(`blocked.title.${kind}`) : t("title")}
        description={
          blocked ? (
            <div ref={messageRef} tabIndex={-1} className="flex flex-col gap-3">
              <p>{t(`blocked.lede.${kind}`)}</p>
              {households.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {households.map((household) => (
                    <li key={household.href}>
                      <Link
                        href={household.href}
                        className="text-brand underline underline-offset-4"
                      >
                        {household.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <p>{t("lede")}</p>
              <p>{t("prompt", { email })}</p>
            </>
          )
        }
        actions={
          blocked ? (
            <Button onClick={onCancel}>{t("blocked.close")}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onCancel} disabled={pending}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="danger" pending={pending} pendingLabel={t("deleting")}>
                <Trash2 aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
                {t("confirm")}
              </Button>
            </>
          )
        }
      >
        {!blocked && (
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
        )}
      </Dialog>
    </form>
  );
}
