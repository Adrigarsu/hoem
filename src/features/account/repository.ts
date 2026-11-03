import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { LastOwnerError, WrongConfirmationError, type AccountGateway } from "./service";

const avatarsBucket = "avatars";

const householdRow = z
  .object({
    id: z.uuid(),
    name: z.string(),
    memberships: z.array(z.object({ user_id: z.uuid(), role: z.enum(["owner", "member"]) })),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    members: row.memberships.map((member) => ({ userId: member.user_id, role: member.role })),
  }));

// The stable codes private.delete_own_account puts in the HINT. Anything else, including
// `files_left`, is a fault the user can retry, logged and never shown.
function deletionError(error: { code: string; message: string; hint?: string | null }): Error {
  if (error.hint === "wrong_confirmation") return new WrongConfirmationError();
  if (error.hint === "last_owner") return new LastOwnerError();
  return Object.assign(new Error(error.message), { code: error.code, hint: error.hint });
}

// Everything runs with the user's own JWT: no service-role key (ADR-004, ADR-019).
export async function accountGateway(): Promise<AccountGateway> {
  const supabase = await createClient();
  return {
    // getClaims verifies the JWT signature, like the proxy does.
    async signedInUser() {
      const { data } = await supabase.auth.getClaims();
      if (!data) return null;
      return { id: data.claims.sub, email: data.claims.email ?? "" };
    },
    // Row-level security limits this to the user's households, with all their members.
    async myHouseholds() {
      const { data, error } = await supabase
        .from("households")
        .select("id, name, memberships(user_id, role)");
      if (error) throw error;
      return z.array(householdRow).parse(data);
    },
    async avatarFiles(userId) {
      const { data, error } = await supabase.storage.from(avatarsBucket).list(userId);
      if (error) throw error;
      return data.map((file) => `${userId}/${file.name}`);
    },
    async clearAvatarPath(userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_path: null })
        .eq("id", userId);
      if (error) throw error;
    },
    async removeAvatars(paths) {
      const { error } = await supabase.storage.from(avatarsBucket).remove(paths);
      if (error) throw error;
    },
    async deleteOwnAccount(confirmation) {
      const { error } = await supabase.rpc("delete_own_account", { confirmation });
      if (error) throw deletionError(error);
    },
    // Only this browser: the deletion already ended every session of the account.
    async signOut() {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    },
  };
}
