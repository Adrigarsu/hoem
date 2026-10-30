import "server-only";
import { connection } from "next/server";
import { z } from "zod";
import { ForbiddenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { familyRoles, householdTypes } from "./domain/household-rules";
import { TypeChangeRefusedError, type HouseholdGateway, type TypeChangeRefusal } from "./service";

const householdRow = z.object({ id: z.uuid(), name: z.string(), type: z.enum(householdTypes) });

const memberRow = z
  .object({
    user_id: z.uuid(),
    role: z.enum(["owner", "member"]),
    family_role: z.enum(familyRoles).nullable(),
  })
  .transform((row) => ({ userId: row.user_id, role: row.role, familyRole: row.family_role }));

// The messages private.change_household_type raises for a type the household cannot take
// (supabase/migrations/20261028190949_household-type.sql).
const refusals: Record<string, TypeChangeRefusal> = {
  "a single-person household cannot have other members": "otherMembers",
  "a household with someone under 14 must stay a family": "minor",
};

type PostgrestError = { code: string; message: string };

// Known refusals become typed errors the service and the forms understand; anything else is a
// fault and is thrown as it is, to be logged, never shown.
function databaseError(error: PostgrestError): Error {
  const refusal = refusals[error.message];
  if (refusal) return new TypeChangeRefusedError(refusal);
  if (error.code === "42501") return new ForbiddenError(error.message);
  return Object.assign(new Error(error.message), { code: error.code });
}

export async function householdGateway(): Promise<HouseholdGateway> {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  const supabase = await createClient();
  return {
    // getClaims verifies the JWT signature, like the proxy does.
    async signedInUserId() {
      const { data } = await supabase.auth.getClaims();
      return data?.claims.sub ?? null;
    },
    async createHousehold(name, type) {
      const { data, error } = await supabase.rpc("create_household", {
        name,
        household_type: type,
      });
      if (error) throw databaseError(error);
      return z.uuid().parse(data);
    },
    async myHouseholds() {
      const { data, error } = await supabase
        .from("households")
        .select("id, name, type")
        .order("created_at");
      if (error) throw databaseError(error);
      return z.array(householdRow).parse(data);
    },
    async householdById(id) {
      const { data, error } = await supabase
        .from("households")
        .select("id, name, type")
        .eq("id", id)
        .maybeSingle();
      if (error) throw databaseError(error);
      return data ? householdRow.parse(data) : null;
    },
    async membersOf(householdId) {
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, role, family_role")
        .eq("household_id", householdId)
        .order("created_at")
        .order("user_id");
      if (error) throw databaseError(error);
      return z.array(memberRow).parse(data);
    },
    async renameHousehold(id, name) {
      const { error } = await supabase.from("households").update({ name }).eq("id", id);
      if (error) throw databaseError(error);
    },
    async changeHouseholdType(id, type, roles) {
      const { error } = await supabase.rpc("change_household_type", {
        household_id: id,
        new_type: type,
        family_roles: roles,
      });
      if (error) throw databaseError(error);
    },
  };
}
