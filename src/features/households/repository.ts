import "server-only";
import { connection } from "next/server";
import { z } from "zod";
import type { ApiCredentials } from "@/lib/api-credentials";
import { createClient, createTokenClient } from "@/lib/supabase/server";
import { chosenHousehold, rememberActiveHousehold } from "./active-household-cookie";
import { familyRoles, householdTypes } from "./domain/household-rules";
import { databaseError } from "./database-error";
import type { HouseholdGateway } from "./service";

const householdRow = z.object({ id: z.uuid(), name: z.string(), type: z.enum(householdTypes) });

// PostgREST returns an embedded count as a one-element array.
const householdSummaryRow = householdRow
  .extend({ memberships: z.tuple([z.object({ count: z.number().int() })]) })
  .transform(({ memberships, ...household }) => ({
    ...household,
    memberCount: memberships[0].count,
  }));

const memberRow = z
  .object({
    user_id: z.uuid(),
    role: z.enum(["owner", "member"]),
    family_role: z.enum(familyRoles).nullable(),
    display_name: z.string().nullable(),
    avatar_path: z.string().nullable(),
  })
  .transform((row) => ({
    userId: row.user_id,
    role: row.role,
    familyRole: row.family_role,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
  }));

const avatarBucket = "avatars";
// Short, because anyone holding a signed URL can load the photo until it expires (FR-ACC-007).
const signedUrlSeconds = 15 * 60;

// The session cookie by default; a REST request with a Bearer token runs as that token's user.
export async function householdGateway({
  accessToken,
}: ApiCredentials = {}): Promise<HouseholdGateway> {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  const supabase = accessToken ? createTokenClient(accessToken) : await createClient();
  return {
    // getClaims verifies the JWT signature, like the proxy does.
    async signedInUserId() {
      const { data } = await supabase.auth.getClaims(accessToken);
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
        .select("id, name, type, memberships(count)")
        .order("created_at");
      if (error) throw databaseError(error);
      return z.array(householdSummaryRow).parse(data);
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
    // Through household_members, the only way to read other members' names and photos.
    async membersOf(householdId) {
      const { data, error } = await supabase.rpc("household_members", {
        household_id: householdId,
      });
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
    async avatarUrls(paths) {
      const { data, error } = await supabase.storage
        .from(avatarBucket)
        .createSignedUrls(paths, signedUrlSeconds);
      if (error) throw error;
      // A photo the user may not read, or one already gone, comes back without a URL.
      return Object.fromEntries(
        data.flatMap(({ path, signedUrl }) => (path && signedUrl ? [[path, signedUrl]] : [])),
      );
    },
    async setMemberRole(householdId, userId, role) {
      const { error } = await supabase.rpc("set_member_role", {
        household_id: householdId,
        member_id: userId,
        new_role: role,
      });
      if (error) throw databaseError(error);
    },
    async setFamilyRole(householdId, userId, familyRole) {
      const { data, error } = await supabase
        .from("memberships")
        .update({ family_role: familyRole })
        .eq("household_id", householdId)
        .eq("user_id", userId)
        .select("user_id");
      if (error) throw databaseError(error);
      return data.length > 0;
    },
    async removeMember(householdId, userId) {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("household_id", householdId)
        .eq("user_id", userId);
      if (error) throw databaseError(error);
    },
    preferredHouseholdId: chosenHousehold,
    rememberHousehold: rememberActiveHousehold,
  };
}
