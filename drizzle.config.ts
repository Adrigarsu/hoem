import { defineConfig } from "drizzle-kit";

// Drizzle only generates migrations; the Supabase CLI applies them (ADR-003, ADR-014). The CLI
// reads supabase/migrations/ only, and the "supabase" prefix gives files the timestamp names it
// expects.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./supabase/migrations",
  migrations: {
    prefix: "supabase",
  },
});
