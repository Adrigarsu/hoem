"use client";

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import {
  Button,
  buttonClassName,
  FormMessage,
  RadioCard,
  TextField,
  useFormFocus,
} from "@/design-system";
import { createHouseholdAction, type HouseholdFormState } from "../actions";
import { householdTypes } from "../domain/household-rules";
import { createHouseholdSchema, fieldErrors, type ValidationKey } from "../schemas";

const initialState: HouseholdFormState = { status: "idle" };

// New household (new-household.md, FR-ACC-009): a name and a type. The type is not pre-chosen, so
// nobody creates a family or a flat by accident.
export function NewHouseholdForm({ cancelHref }: { cancelHref: string }) {
  const t = useTranslations("Households");
  const [state, action, pending] = useActionState(createHouseholdAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const refused = state.status === "refused";
  const { formRef, messageRef } = useFormFocus(errors, refused);

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = createHouseholdSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
  }

  const typeError = errors?.type ? t("validation.typeRequired") : undefined;
  const nameError = errors?.name ? t(`validation.${errors.name}`, { member: "" }) : undefined;

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={validate}
      noValidate
      aria-labelledby="new-household-title"
      className="flex flex-col gap-6"
    >
      <Link
        href={cancelHref}
        className="-ml-3 inline-flex h-control-height items-center gap-1 self-start rounded-md px-3 text-label text-brand hover:bg-surface-subtle"
      >
        <ChevronLeft aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        {t("new.back")}
      </Link>
      <div className="flex flex-col gap-2">
        <h1 id="new-household-title" className="text-title font-bold text-text">
          {t("new.title")}
        </h1>
        <p className="text-body text-text-secondary">{t("new.lede")}</p>
      </div>
      {refused && (
        <FormMessage ref={messageRef} tone="danger">
          {t("new.minorCreator")}
        </FormMessage>
      )}
      <TextField
        label={t("new.name")}
        name="name"
        autoComplete="off"
        maxLength={60}
        defaultValue={state.values?.name}
        error={nameError}
        required
      />
      <fieldset
        aria-describedby={typeError ? "household-type-error" : undefined}
        className="flex flex-col gap-2"
      >
        <legend className="mb-2 text-label text-text">{t("new.who")}</legend>
        {householdTypes.map((type) => (
          <RadioCard
            key={type}
            name="type"
            value={type}
            title={t(`types.${type}`)}
            description={t(`typeDescriptions.${type}`)}
            defaultChecked={state.values?.type === type}
          />
        ))}
        {typeError && (
          <p id="household-type-error" className="text-small font-medium text-danger">
            {typeError}
          </p>
        )}
      </fieldset>
      <div className="sticky bottom-0 -mx-6 mt-auto grid grid-cols-2 gap-3 border-t border-border bg-bg px-6 pt-4 pb-8 md:static md:mx-0 md:flex md:justify-end md:border-0 md:p-0">
        <Link href={cancelHref} className={buttonClassName("secondary")}>
          {t("new.cancel")}
        </Link>
        <Button type="submit" pending={pending} pendingLabel={t("new.creating")}>
          {t("new.create")}
        </Button>
      </div>
    </form>
  );
}
