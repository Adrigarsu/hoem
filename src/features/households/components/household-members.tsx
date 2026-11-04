"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useRef, useState, type ReactNode } from "react";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  FormMessage,
  IconButton,
  SelectField,
  Toast,
  ToastPortal,
  useUndoTimer,
} from "@/design-system";
import {
  changeFamilyRoleAction,
  removeMemberAction,
  setMemberRoleAction,
  type MemberFormState,
} from "../actions";
import { familyRoles, type FamilyRole } from "../domain/household-rules";
import { memberApiPath } from "../paths";
import type { HouseholdSettingsView, MemberView } from "../service";

const idle: MemberFormState = { status: "idle" };
const noop = () => undefined;

type Notice = { kind: "removed" | "removeFailed"; name: string; userId: string };

// What a member's row and dialog call them: "Marcos", or a placeholder for a member without a name.
function useMemberName() {
  const t = useTranslations("Households.members");
  return (member: MemberView) => member.displayName ?? t("noName");
}

// The Members section of household settings (FR-ACC-006, FR-HH-006, FR-HH-008): everyone sees every
// member's name, photo and role; whoever may change a member gets "Options for {name}". Removing
// someone hides their row at once with a 5-second undo (ADR-009).
//
// The signed-in user's own avatar comes from the page as ownAvatar: it is profile's OwnAvatar, which
// hides the photo during its own undo, and profile's index also holds server-only code a client
// component cannot import.
export function HouseholdMembers({
  household,
  ownAvatar,
}: {
  household: HouseholdSettingsView;
  ownAvatar: ReactNode;
}) {
  const t = useTranslations("Households");
  const nameOf = useMemberName();
  const [openId, setOpenId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const removal = useUndoTimer();
  // Separate from the removal, so dismissing a message is never mistaken for committing a removal.
  const dismissal = useUndoTimer();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The member whose removal Undo would cancel. An earlier removal is already sent when a new one
  // starts (useUndoTimer commits it), so Undo must not bring that member back.
  const waiting = useRef<string | null>(null);
  const isFamily = household.type === "family";

  function commit(member: MemberView) {
    // Only this removal's toast: a newer removal starting is what commits this one.
    setNotice((current) => (current?.userId === member.userId ? null : current));
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const removed = await removeMemberAction(household.id, member.userId);
        if (!removed) {
          setHidden((ids) => ids.filter((id) => id !== member.userId));
          setNotice({ kind: "removeFailed", name: nameOf(member), userId: member.userId });
          dismissal.start(() => setNotice(null));
        }
        resolve();
      });
    });
  }

  function remove(member: MemberView) {
    setOpenId(null);
    setAnnouncement(null);
    dismissal.undo();
    setHidden((ids) => [...ids, member.userId]);
    waiting.current = member.userId;
    setNotice({ kind: "removed", name: nameOf(member), userId: member.userId });
    // The row and its button go away: focus moves to the section, the nearest place that stays.
    headingRef.current?.focus();
    removal.start(() => commit(member), {
      onUnload() {
        // A Server Action is cancelled with the page; a keepalive request outlives it (ADR-020).
        void fetch(memberApiPath(household.id, member.userId), {
          method: "DELETE",
          keepalive: true,
        }).catch(noop);
        // Back from the browser's cache the removal is done: Undo must not be offered.
        setNotice(null);
      },
    });
  }

  function undo() {
    removal.undo();
    const undone = waiting.current;
    waiting.current = null;
    setHidden((ids) => ids.filter((id) => id !== undone));
    setNotice(null);
  }

  function saved(message: string) {
    setOpenId(null);
    setAnnouncement(message);
  }

  const roleLine = (member: MemberView) =>
    [
      t(`roles.${member.role}`),
      isFamily && member.familyRole ? t(`familyRoles.${member.familyRole}`) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const visible = household.members.filter((member) => !hidden.includes(member.userId));

  return (
    <Card aria-labelledby="household-members" className="max-w-content-width">
      <h2 ref={headingRef} id="household-members" tabIndex={-1} className="text-subtitle text-text">
        {t("members.title")}
      </h2>
      {announcement && <FormMessage tone="success">{announcement}</FormMessage>}
      <ul className="-mx-2 flex flex-col">
        {visible.map((member) => {
          const name = nameOf(member);
          const offered = Object.keys(member.permissions).length > 0;
          return (
            <li
              key={member.userId}
              className="flex min-h-16 items-center gap-3 border-t border-border py-2 pr-2 pl-2 first:border-t-0"
            >
              {member.isYou ? (
                ownAvatar
              ) : (
                // Another member's photo, not the signed-in user's: OwnAvatar is only for one's own.
                // eslint-disable-next-line no-restricted-syntax
                <Avatar name={name} src={member.avatarUrl} />
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body font-semibold text-text">
                  {member.isYou ? t("members.you", { name }) : name}
                </span>
                <span className="text-small text-text-secondary">{roleLine(member)}</span>
              </span>
              {offered && (
                <IconButton
                  icon={ChevronRight}
                  label={t("members.options", { name })}
                  tooltipAlign="end"
                  variant="ghost"
                  onClick={() => {
                    setAnnouncement(null);
                    setOpenId(member.userId);
                  }}
                />
              )}
              {offered && (
                <MemberOptions
                  household={household}
                  member={member}
                  open={openId === member.userId}
                  onClose={() => setOpenId((id) => (id === member.userId ? null : id))}
                  onSaved={saved}
                  onRemove={() => remove(member)}
                />
              )}
            </li>
          );
        })}
      </ul>
      <ToastPortal>
        <Toast
          message={notice && t(`members.${notice.kind}`, { name: notice.name })}
          tone={notice?.kind === "removeFailed" ? "danger" : "success"}
          action={
            notice?.kind === "removed" ? { label: t("members.undo"), onClick: undo } : undefined
          }
          onPause={() => {
            removal.pause();
            dismissal.pause();
          }}
          onResume={() => {
            removal.resume();
            dismissal.resume();
          }}
        />
      </ToastPortal>
    </Card>
  );
}

type MemberOptionsProps = {
  household: HouseholdSettingsView;
  member: MemberView;
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  onRemove: () => void;
};

// "Options for {name}": only the changes the user may make, and the blocked ones with what to do
// first (household-settings.md). Each change is its own form, so each answer belongs to one action.
function MemberOptions({
  household,
  member,
  open,
  onClose,
  onSaved,
  onRemove,
}: MemberOptionsProps) {
  const t = useTranslations("Households");
  const name = useMemberName()(member);
  const [roleState, roleAction, rolePending] = useActionState(setMemberRoleAction, idle);
  const [familyState, familyAction, familyPending] = useActionState(changeFamilyRoleAction, idle);
  const [handled, setHandled] = useState({ role: idle, family: idle });
  const [refusal, setRefusal] = useState<MemberFormState["refusal"]>();
  const { permissions } = member;

  function close() {
    setRefusal(undefined);
    onClose();
  }

  // Each answer of the server is acted on once: a saved change or a stale page closes the dialog
  // and announces it; a refusal stays in the dialog and says what to do first.
  function answer(state: MemberFormState, saved: string) {
    if (state.status === "saved") onSaved(saved);
    if (state.status === "stale") onSaved(t("members.stale"));
    setRefusal(state.status === "refused" ? state.refusal : undefined);
  }
  if (roleState !== handled.role) {
    setHandled({ ...handled, role: roleState });
    answer(
      roleState,
      t(member.role === "owner" ? "members.savedMember" : "members.savedOwner", { name }),
    );
  }
  if (familyState !== handled.family) {
    setHandled({ ...handled, family: familyState });
    answer(familyState, t("members.savedFamilyRole", { name, role: chosenRole(familyState) }));
  }

  // The role the server saved, sent back in the form: the select is uncontrolled.
  function chosenRole(state: MemberFormState): FamilyRole {
    return state.familyRole ?? member.familyRole ?? "relative";
  }

  const hidden = (
    <>
      <input type="hidden" name="householdId" value={household.id} />
      <input type="hidden" name="userId" value={member.userId} />
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t("members.options", { name })}
      description={<p>{t("members.optionsLede", { name, household: household.name })}</p>}
      actions={
        <Button variant="secondary" onClick={close}>
          {t("members.close")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {refusal && <FormMessage tone="danger">{t(`members.${refusal}`)}</FormMessage>}

        {permissions.makeOwner && (
          <form action={roleAction}>
            {hidden}
            <input type="hidden" name="role" value="owner" />
            <Button
              type="submit"
              variant="secondary"
              pending={rolePending}
              pendingLabel={t("members.saving")}
            >
              {t("members.makeOwner")}
            </Button>
          </form>
        )}

        {permissions.stepDown === "allowed" && (
          <form action={roleAction}>
            {hidden}
            <input type="hidden" name="role" value="member" />
            <Button
              type="submit"
              variant="secondary"
              pending={rolePending}
              pendingLabel={t("members.saving")}
            >
              {member.isYou ? t("members.stepDown") : t("members.makeMember")}
            </Button>
          </form>
        )}
        {permissions.stepDown === "lastOwner" && (
          <FormMessage tone="warning">{t("members.lastOwner")}</FormMessage>
        )}

        {permissions.familyRole && (
          <form action={familyAction} className="flex flex-col gap-3">
            {hidden}
            <SelectField
              label={t("members.familyRole")}
              name="familyRole"
              defaultValue={member.familyRole ?? ""}
              options={familyRoles.map((role) => ({
                value: role,
                label: t(`familyRoles.${role}`),
              }))}
              disabled={permissions.familyRole === "lastParent"}
              help={permissions.familyRole === "lastParent" ? t("members.lastParent") : undefined}
            />
            {permissions.familyRole === "allowed" && (
              <Button
                type="submit"
                variant="secondary"
                className="self-start"
                pending={familyPending}
                pendingLabel={t("members.saving")}
              >
                {t("members.saveFamilyRole")}
              </Button>
            )}
          </form>
        )}

        {permissions.remove && (
          <Button variant="danger" className="self-start" onClick={onRemove}>
            {t("members.remove")}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
