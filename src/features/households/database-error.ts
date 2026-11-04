import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  MemberChangeRefusedError,
  MinorCannotCreateError,
  TypeChangeRefusedError,
  type MemberChangeRefusal,
  type TypeChangeRefusal,
} from "./service";

// The stable codes the household functions put in the HINT of a refusal
// (supabase/migrations/20261028190949_household-type.sql); messages may be reworded, codes may not.
const typeChangeRefusals: Record<string, TypeChangeRefusal> = {
  other_members: "otherMembers",
  minor_member: "minor",
};

// The triggers that keep an owner and a parent (supabase/migrations/*_household-members.sql).
const memberChangeRefusals: Record<string, MemberChangeRefusal> = {
  last_owner: "lastOwner",
  last_parent: "lastParent",
};

export type PostgrestError = { code: string; message: string; hint?: string | null };

// Known refusals become typed errors the service and the forms understand; anything else is a
// fault and is thrown as it is, to be logged, never shown.
export function databaseError(error: PostgrestError): Error {
  const refusal = typeChangeRefusals[error.hint ?? ""];
  if (refusal) return new TypeChangeRefusedError(refusal);
  const memberRefusal = memberChangeRefusals[error.hint ?? ""];
  if (memberRefusal) return new MemberChangeRefusedError(memberRefusal);
  if (error.hint === "not_member") return new NotFoundError(error.message);
  if (error.hint === "minor_creator") return new MinorCannotCreateError();
  if (error.code === "42501") return new ForbiddenError(error.message);
  return Object.assign(new Error(error.message), { code: error.code });
}
