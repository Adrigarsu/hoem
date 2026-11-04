"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, buttonClassName, FormMessage, TextField, useFormFocus } from "@/design-system";
import {
  changePhotoAction,
  saveNameAction,
  type NameFormState,
  type PhotoFailure,
  type PhotoFormState,
} from "../actions";
import { avatarAccept, avatarHeadBytes, avatarRejection } from "../domain/avatar-rules";
import { fieldErrors, nameSchema, type ValidationKey } from "../schemas";
import { OwnAvatar, useOwnPhoto } from "./own-photo";

type AccountFormProps = {
  profile: { displayName: string; email: string; avatarUrl: string | null };
};

// The Account card and page (FR-ACC-007, profile.md). The email is read-only: changing it is #80.
export function AccountForm({ profile }: AccountFormProps) {
  const t = useTranslations("Profile");
  return (
    <div className="flex flex-col gap-4">
      <PhotoForm name={profile.displayName} photo={profile.avatarUrl} />
      <NameForm name={profile.displayName} />
      {profile.email && (
        <div className="flex flex-col gap-1">
          <p className="text-label text-text">{t("email")}</p>
          <p className="text-body break-words text-text-secondary">{profile.email}</p>
        </div>
      )}
    </div>
  );
}

const noPhotoChange: PhotoFormState = { status: "idle" };

function PhotoForm({ name, photo }: { name: string; photo: string | null }) {
  const t = useTranslations("Profile.photo");
  const [state, action, pending] = useActionState(changePhotoAction, noPhotoChange);
  // Set when the browser already knows the file is wrong, so it is never sent.
  const [refused, setRefused] = useState<PhotoFailure>();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = useId();
  const ownPhoto = useOwnPhoto();
  const shown = photo !== null && !ownPhoto.hidden;
  // So "Photo updated" from an earlier change does not stay next to the initials.
  const [removed, setRemoved] = useState(false);

  function remove() {
    ownPhoto.remove();
    setRemoved(true);
    // The button disappears with the photo; without this, focus would fall back to the page.
    inputRef.current?.focus();
  }

  async function send(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const head = new Uint8Array(await file.slice(0, avatarHeadBytes).arrayBuffer());
    const rejection = avatarRejection({ size: file.size, head });
    setRefused(rejection ?? undefined);
    if (rejection) {
      // So choosing the same file again still counts as a change.
      input.value = "";
      return;
    }
    ownPhoto.undo();
    setRemoved(false);
    formRef.current?.requestSubmit();
  }

  const failure = refused ?? (state.status === "failed" ? state.reason : undefined);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <OwnAvatar name={name} src={photo} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap gap-2">
            {/* The real file input, hidden but focusable; its label is what people see and press. */}
            <label
              className={`${buttonClassName("secondary")} cursor-pointer self-start has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring`}
              aria-busy={pending}
            >
              <input
                ref={inputRef}
                type="file"
                name="photo"
                accept={avatarAccept}
                aria-describedby={helpId}
                onChange={send}
                className="sr-only"
              />
              {pending ? t("uploading") : t("change")}
            </label>
            {shown && !pending && (
              <Button variant="ghost" onClick={remove}>
                {t("remove")}
              </Button>
            )}
          </div>
          <p id={helpId} className="text-small text-text-secondary">
            {t("help")}
          </p>
        </div>
      </div>
      {/* In the page from the start, so a screen reader announces the change of text. */}
      <p role="status" className="text-small text-text-secondary">
        {!pending && !failure && state.status === "saved" && !removed && t("saved")}
      </p>
      {failure && !pending && <FormMessage tone="danger">{t(failure)}</FormMessage>}
    </form>
  );
}

const nameUnchanged: NameFormState = { status: "idle" };

function NameForm({ name }: { name: string }) {
  const t = useTranslations("Profile");
  const [state, action, pending] = useActionState(saveNameAction, nameUnchanged);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const { formRef } = useFormFocus(errors, false);

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = nameSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={validate}
      noValidate
      className="flex flex-col gap-3"
    >
      <TextField
        label={t("name")}
        name="name"
        autoComplete="name"
        defaultValue={state.values?.name ?? name}
        error={errors?.name ? t(`validation.${errors.name}`) : undefined}
      />
      {state.status === "failed" && !pending && (
        <FormMessage tone="danger">{t("failed")}</FormMessage>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p role="status" className="text-small text-text-secondary">
          {state.status === "saved" && !clientErrors && !pending && t("saved")}
        </p>
        <Button type="submit" pending={pending} pendingLabel={t("saving")}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
