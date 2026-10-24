import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const problems = result.error.issues.map(
    (issue) => `- ${issue.path.join(".")}: ${issue.message}`,
  );
  throw new Error(`Invalid environment variables:\n${problems.join("\n")}`);
}

// Next.js only inlines NEXT_PUBLIC_* variables into browser code when each one is read by its
// literal name, so passing process.env as a whole would leave them undefined in the browser.
export const env = parseEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
