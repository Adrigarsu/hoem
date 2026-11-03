import { z } from "zod";
import { formFieldErrors } from "@/lib/validation";

// Messages are keys under Account.validation (docs/architecture.md §4.2).
export type ValidationKey = "required" | "tooLong";

export function fieldErrors(error: z.ZodError | undefined): Record<string, ValidationKey> {
  return formFieldErrors<ValidationKey>(error);
}

// The longest address an e-mail can have (RFC 5321).
export const deleteAccountSchema = z.object({
  confirmation: z.string().trim().min(1, { error: "required" }).max(254, { error: "tooLong" }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
