import { z } from "zod";

import { validateEnv } from "./validate-env";

// Kept apart from server-env.ts so next.config.ts, which runs outside React, can validate it.
const serverEnvSchema = z.object({
  RESEND_API_KEY: z.string().startsWith("re_"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return validateEnv(serverEnvSchema, source);
}
