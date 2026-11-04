import "server-only";
import { z } from "zod";
import type { ApiCredentials } from "@/lib/api-credentials";
import { createClient, createTokenClient } from "@/lib/supabase/server";
import { toTheme } from "@/lib/theme/theme";
import type { ProfileGateway } from "./service";

const bucket = "avatars";
// Short, because anyone holding a signed URL can load the file until it expires (FR-ACC-007).
const signedUrlSeconds = 15 * 60;

const profileRow = z
  .object({
    display_name: z.string(),
    time_zone: z.string(),
    theme: z.string(),
    avatar_path: z.string().nullable(),
  })
  .transform((row) => ({
    displayName: row.display_name,
    timeZone: row.time_zone,
    theme: toTheme(row.theme),
    avatarPath: row.avatar_path,
  }));

// The session cookie by default; a REST request with a Bearer token runs as that token's user.
export async function profileGateway({
  accessToken,
}: ApiCredentials = {}): Promise<ProfileGateway> {
  const supabase = accessToken ? createTokenClient(accessToken) : await createClient();
  return {
    // getClaims verifies the JWT signature, like the proxy does.
    async signedInUser() {
      const { data } = await supabase.auth.getClaims(accessToken);
      if (!data) return null;
      // Every way to sign up asks for an email; without one the menu leaves out the email line.
      return { id: data.claims.sub, email: data.claims.email ?? "" };
    },
    async profileById(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, time_zone, theme, avatar_path")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ? profileRow.parse(data) : null;
    },
    async updateProfile(userId, { displayName, theme, avatarPath }) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, theme, avatar_path: avatarPath })
        .eq("id", userId);
      if (error) throw error;
    },
    async uploadAvatar(path, image) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, image, { contentType: "image/webp" });
      if (error) throw error;
    },
    async removeAvatar(path) {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
    },
    async avatarFiles(userId) {
      const { data, error } = await supabase.storage.from(bucket).list(userId);
      if (error) throw error;
      return data.map((file) => `${userId}/${file.name}`);
    },
    async avatarUrl(path) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, signedUrlSeconds);
      if (error) throw error;
      return data.signedUrl;
    },
  };
}
