import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ProfileGateway } from "./service";

const profileRow = z
  .object({ display_name: z.string(), time_zone: z.string() })
  .transform((row) => ({ displayName: row.display_name, timeZone: row.time_zone }));

export async function profileGateway(): Promise<ProfileGateway> {
  const supabase = await createClient();
  return {
    // getClaims verifies the JWT signature, like the proxy does.
    async signedInUserId() {
      const { data } = await supabase.auth.getClaims();
      return data?.claims.sub ?? null;
    },
    async profileById(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, time_zone")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ? profileRow.parse(data) : null;
    },
  };
}
