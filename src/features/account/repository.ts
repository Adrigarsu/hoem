import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { HandOverFirstError, WrongConfirmationError, type AccountGateway } from "./service";

const avatarsBucket = "avatars";
// Storage lists 100 objects unless asked for more, and removes at most 1000 per call.
const storagePage = 1000;

const householdRow = z
  .object({
    id: z.uuid(),
    name: z.string(),
    type: z.string(),
    memberships: z.array(
      z.object({
        user_id: z.uuid(),
        role: z.enum(["owner", "member"]),
        family_role: z.enum(["parent", "child", "relative"]).nullable(),
      }),
    ),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    members: row.memberships.map((member) => ({
      userId: member.user_id,
      role: member.role,
      familyRole: member.family_role,
    })),
  }));

// The stable codes private.delete_own_account puts in the HINT. Anything else, including
// `files_left`, is a fault the user can retry, logged and never shown.
function deletionError(error: { code: string; message: string; hint?: string | null }): Error {
  if (error.hint === "wrong_confirmation") return new WrongConfirmationError();
  if (error.hint === "last_owner" || error.hint === "last_parent") return new HandOverFirstError();
  return Object.assign(new Error(error.message), { code: error.code, hint: error.hint });
}

// Everything runs with the user's own JWT: no service-role key (ADR-004, ADR-019).
export async function accountGateway(): Promise<AccountGateway> {
  const supabase = await createClient();
  return {
    // From Auth, not from the token's claims: delete_own_account compares the confirmation with
    // auth.users, and a token issued before an e-mail change still carries the old address.
    async signedInUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      return { id: data.user.id, email: data.user.email ?? "" };
    },
    // Row-level security limits this to the user's households, with all their members.
    async myHouseholds() {
      const { data, error } = await supabase
        .from("households")
        .select("id, name, type, memberships(user_id, role, family_role)");
      if (error) throw error;
      return z.array(householdRow).parse(data);
    },
    async avatarFiles(userId) {
      const files: string[] = [];
      for (let offset = 0; ; offset += storagePage) {
        const { data, error } = await supabase.storage
          .from(avatarsBucket)
          .list(userId, { limit: storagePage, offset });
        if (error) throw error;
        files.push(...data.map((file) => `${userId}/${file.name}`));
        if (data.length < storagePage) return files;
      }
    },
    async clearAvatarPath(userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_path: null })
        .eq("id", userId);
      if (error) throw error;
    },
    async removeAvatars(paths) {
      for (let start = 0; start < paths.length; start += storagePage) {
        const { error } = await supabase.storage
          .from(avatarsBucket)
          .remove(paths.slice(start, start + storagePage));
        if (error) throw error;
      }
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
