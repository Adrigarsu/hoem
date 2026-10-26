import { existsSync, readFileSync } from "node:fs";
import { parseEnv as parseEnvFile } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { validateEnv } from "@/lib/validate-env";

// The same rules as src/lib/env.ts, which cannot be imported here: it reads process.env when it
// loads, before .env.local has been parsed.
const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

// CI sets the local Supabase URL and key as variables; locally they come from the .env.local the
// app reads. Only these two public values are taken, and only a local Supabase is accepted, so the
// tests never sign up accounts in a real project.
function localSupabase() {
  const file = existsSync(".env.local") ? parseEnvFile(readFileSync(".env.local", "utf8")) : {};
  const config = validateEnv(supabaseEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? file.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? file.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  const { hostname } = new URL(config.NEXT_PUBLIC_SUPABASE_URL);
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`E2E tests run only against the local Supabase, not ${hostname}`);
  }
  return config;
}

// The households an account can read, through the Data API with that account's own session, so
// row-level security applies as it does in the app.
export async function householdsOf(email: string, password: string) {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = localSupabase();
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const { data, error } = await supabase
    .from("households")
    .select("name, type, settings, memberships(role)");
  if (error) throw error;
  return data;
}
