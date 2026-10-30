"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  Dialog,
  FormMessage,
  SelectField,
  TextField,
  useFormFocus,
} from "@/design-system";
import {
  changeHouseholdTypeAction,
  renameHouseholdAction,
  type HouseholdFormState,
} from "../actions";
import {
  familyRoles,
  householdTypes,
  type FamilyRole,
  type HouseholdType,
} from "../domain/household-rules";
import { familyRoleProblems, typeChangeBlock } from "../domain/type-change";
import { fieldErrors, renameHouseholdSchema, type ValidationKey } from "../schemas";
import type { HouseholdSettingsView } from "../service";

const idle: HouseholdFormState = { status: "idle" };

// Which dialog of the type change is open (household-type.md): the warning, the family roles, or
// a refusal instead of the warning.
type Step = "warning" | "roles" | "otherMembers" | "minor";

type RoleErrors = Record<string, ValidationKey>;

const isFamilyRole = (value: unknown): value is FamilyRole =>
  familyRoles.some((role) => role === value);

const hasRoleErrors = (errors: Record<string, ValidationKey> | undefined) =>
  Object.keys(errors ?? {}).some((field) => field.startsWith("familyRoles"));

// The name of a member's family role select, which the Server Action reads.
const roleField = (userId: string) => `familyRoles.${userId}`;

// The Details section of household settings (FR-ACC-009, FR-HH-007). Owners rename the household
// and change its type; members see both read-only, with the reason in text.
export function HouseholdDetails({ household }: { household: HouseholdSettingsView }) {
  const t = useTranslations("Households");
  return (
    <Card aria-labelledby="household-details" className="max-w-content-width">
      <h2 id="household-details" className="text-subtitle text-text">
        {t("settings.details")}
      </h2>
      <RenameForm household={household} />
      <TypeForm household={household} />
    </Card>
  );
}

function RenameForm({ household }: { household: HouseholdSettingsView }) {
  const t = useTranslations("Households");
  const [state, action, pending] = useActionState(renameHouseholdAction, idle);
  const [clientErrors, setClientErrors] = useState<Record<string, ValidationKey>>();
  const errors = clientErrors ?? state.fieldErrors;
  const { formRef } = useFormFocus(errors, false);

  function validate(event: FormEvent<HTMLFormElement>) {
    const result = renameHouseholdSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors(undefined);
  }

  const nameError = errors?.name ? t(`validation.${errors.name}`, { member: "" }) : undefined;

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={validate}
      noValidate
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="householdId" value={household.id} />
      <TextField
        label={t("settings.name")}
        name="name"
        autoComplete="off"
        maxLength={60}
        defaultValue={state.values?.name ?? household.name}
        disabled={!household.isOwner}
        help={household.isOwner ? undefined : t("settings.onlyOwners")}
        error={nameError}
      />
      {household.isOwner && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {state.status === "saved" && !clientErrors && (
            <p role="status" className="text-small text-text-secondary">
              {t("settings.nameSaved")}
            </p>
          )}
          <Button
            type="submit"
            variant="secondary"
            pending={pending}
            pendingLabel={t("settings.savingName")}
          >
            {t("settings.saveName")}
          </Button>
        </div>
      )}
    </form>
  );
}

function TypeForm({ household }: { household: HouseholdSettingsView }) {
  const t = useTranslations("Households");
  const [state, action, pending] = useActionState(changeHouseholdTypeAction, idle);
  // The type the owner picked and is being asked about; null while nothing is pending.
  const [chosen, setChosen] = useState<HouseholdType | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [roleErrors, setRoleErrors] = useState<RoleErrors>();
  const [handled, setHandled] = useState<HouseholdFormState>(idle);
  // Counts the server's answers; the role selects remount on each, so they show the roles it sent
  // back (an uncontrolled select ignores a new defaultValue).
  const [answers, setAnswers] = useState(0);
  const selectRef = useRef<HTMLSelectElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const currentLabel = t(`types.${household.type}`);
  const others = household.members.filter((member) => !member.isYou).length;

  // Each answer of the server is acted on once: a refusal opens its dialog, missing roles reopen
  // the roles, and a saved change closes everything and announces itself.
  if (state !== handled) {
    setHandled(state);
    setAnswers(answers + 1);
    if (state.status === "refused" && state.refusal && state.refusal !== "minorCreator") {
      setStep(state.refusal);
    }
    // Only role errors reopen the roles; anything else means a tampered request, which the server
    // refused without changing anything.
    if (state.status === "invalid" && hasRoleErrors(state.fieldErrors)) {
      setRoleErrors(state.fieldErrors);
      setStep("roles");
    }
    if (state.status === "saved") {
      setStep(null);
      setChosen(null);
      setRoleErrors(undefined);
    }
  }

  // After a saved change the dialog closes and the browser would return focus to its opener, a
  // button that is gone; the select that started it is where the owner continues.
  useEffect(() => {
    if (state.status === "saved") selectRef.current?.focus();
  }, [state]);

  useEffect(() => {
    const first = Object.keys(roleErrors ?? {})[0];
    if (!first) return;
    const target =
      first === "familyRoles"
        ? rolesRef.current?.querySelector<HTMLElement>("select")
        : rolesRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    target?.focus();
  }, [roleErrors]);

  function choose(type: HouseholdType) {
    if (type === household.type) return;
    setChosen(type);
    setRoleErrors(undefined);
    setStep(typeChangeBlock(type, others) ?? "warning");
  }

  // Back to the household's own type, with focus on the select that started it.
  function cancel() {
    setStep(null);
    setChosen(null);
    setRoleErrors(undefined);
    selectRef.current?.focus();
  }

  function validateRoles(event: FormEvent<HTMLFormElement>) {
    if (chosen !== "family") return;
    const form = new FormData(event.currentTarget);
    const roles: Record<string, FamilyRole> = {};
    for (const member of household.members) {
      const role = form.get(roleField(member.userId));
      if (isFamilyRole(role)) roles[member.userId] = role;
    }
    const { missing, noParent } = familyRoleProblems(
      household.members.map((member) => member.userId),
      roles,
    );
    if (missing.length === 0 && !noParent) {
      setRoleErrors(undefined);
      return;
    }
    event.preventDefault();
    setRoleErrors(
      noParent
        ? { familyRoles: "noParent" }
        : Object.fromEntries(missing.map((id) => [roleField(id), "required" as const])),
    );
  }

  const memberLabel = (index: number, isYou: boolean) =>
    isYou ? t("typeChange.you") : t("typeChange.member", { n: index + 1 });
  const chosenLabel = chosen ? t(`types.${chosen}`) : "";

  return (
    // The select stays outside the form: React resets a form after a successful action, which
    // would put the select back on its first option. The chosen type travels in a hidden input.
    <div className="flex flex-col gap-3">
      <SelectField
        ref={selectRef}
        label={t("settings.type")}
        value={chosen ?? household.type}
        onChange={(event) => choose(event.target.value as HouseholdType)}
        options={householdTypes.map((type) => ({ value: type, label: t(`types.${type}`) }))}
        disabled={!household.isOwner}
        help={household.isOwner ? t("settings.typeHelp") : t("settings.onlyOwners")}
      />
      {state.status === "saved" && (
        <FormMessage tone="success">
          {t("settings.typeSaved", { name: household.name, type: household.type })}
        </FormMessage>
      )}

      <form action={action} onSubmit={validateRoles} noValidate>
        <input type="hidden" name="householdId" value={household.id} />
        <input type="hidden" name="type" value={chosen ?? household.type} />
        <Dialog
          open={step === "warning"}
          onClose={() => step === "warning" && cancel()}
          title={t("typeChange.title", { type: chosenLabel })}
          description={
            <>
              <p>{t("typeChange.lede")}</p>
              {chosen && (
                <ul className="flex list-disc flex-col gap-1 pl-5 text-small">
                  {(t.raw(`typeChange.consequences.${chosen}`) as string[]).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </>
          }
          actions={
            <>
              <Button variant="secondary" onClick={cancel}>
                {t("typeChange.keep", { type: currentLabel })}
              </Button>
              {chosen === "family" ? (
                <Button onClick={() => setStep("roles")}>{t("typeChange.continue")}</Button>
              ) : (
                <Button type="submit" pending={pending} pendingLabel={t("typeChange.changing")}>
                  {t("typeChange.change")}
                </Button>
              )}
            </>
          }
        />

        <Dialog
          open={step === "roles"}
          onClose={() => step === "roles" && cancel()}
          title={t("typeChange.rolesTitle")}
          description={<p>{t("typeChange.rolesLede")}</p>}
          actions={
            <>
              <Button variant="secondary" onClick={() => setStep("warning")}>
                {t("typeChange.back")}
              </Button>
              <Button type="submit" pending={pending} pendingLabel={t("typeChange.changing")}>
                {t("typeChange.changeToFamily")}
              </Button>
            </>
          }
        >
          <div ref={rolesRef} className="flex flex-col gap-4">
            {roleErrors?.familyRoles && (
              <FormMessage tone="danger">{t("validation.noParent")}</FormMessage>
            )}
            {household.members.map((member, index) => {
              const label = memberLabel(index, member.isYou);
              const field = roleField(member.userId);
              return (
                <SelectField
                  key={`${member.userId}-${answers}`}
                  label={`${label} · ${t(`roles.${member.role}`)}`}
                  name={field}
                  // The owner changing the type is pre-set as a parent and can change it (FR-HH-007);
                  // nobody else gets a role by default, so nobody becomes a parent by accident.
                  // React resets the form after each answer, so the server echoes the roles back.
                  defaultValue={
                    state.values?.familyRoles?.[member.userId] ?? (member.isYou ? "parent" : "")
                  }
                  placeholder={t("typeChange.chooseRole")}
                  options={familyRoles.map((role) => ({
                    value: role,
                    label: t(`familyRoles.${role}`),
                  }))}
                  error={
                    roleErrors?.[field]
                      ? t("validation.roleRequired", { member: label })
                      : undefined
                  }
                />
              );
            })}
          </div>
        </Dialog>

        <Dialog
          open={step === "otherMembers"}
          onClose={() => step === "otherMembers" && cancel()}
          role="alertdialog"
          title={t("typeChange.otherMembersTitle")}
          description={
            <p>{t("typeChange.otherMembers", { name: household.name, count: others })}</p>
          }
          actions={<Button onClick={cancel}>{t("typeChange.keep", { type: currentLabel })}</Button>}
        />

        <Dialog
          open={step === "minor"}
          onClose={() => step === "minor" && cancel()}
          role="alertdialog"
          title={t("typeChange.minorTitle")}
          description={<p>{t("typeChange.minor")}</p>}
          actions={<Button onClick={cancel}>{t("typeChange.keepFamily")}</Button>}
        />
      </form>
    </div>
  );
}
