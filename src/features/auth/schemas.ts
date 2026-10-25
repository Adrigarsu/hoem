import { z } from "zod";

// Shared by the forms and the Server Actions (NFR-SEC-002). Messages are keys under
// Auth.validation in messages/en.json, so the UI translates them.

// NIST SP 800-63B: length over composition rules. Supabase stores passwords with bcrypt, which
// reads at most 72 bytes, so longer ones are rejected instead of silently truncated.
export const passwordMinLength = 10;
const passwordMaxBytes = 72;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "invalidEmail" }));

const newPassword = z
  .string()
  .refine((value) => [...value].length >= passwordMinLength, { error: "passwordTooShort" })
  .refine((value) => new TextEncoder().encode(value).length <= passwordMaxBytes, {
    error: "passwordTooLong",
  });

export const signUpSchema = z
  .object({
    displayName: z.string().trim().min(1, { error: "required" }).max(50, { error: "tooLong" }),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "required" }),
});

export const resendSchema = z.object({ email });

// What Check your inbox shows and "Use a different email" puts back in the sign-up form. It
// travels in an HttpOnly cookie (screens README, "Decisions on the hand-off"), so it is parsed
// like any other input.
const pendingSignUpSchema = z.object({
  email: z.email(),
  displayName: z.string().max(50).default(""),
});

export type PendingSignUp = z.infer<typeof pendingSignUpSchema>;

export function readPendingSignUp(value: string | undefined): PendingSignUp | null {
  if (!value) return null;
  try {
    const parsed = pendingSignUpSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export type ValidationKey =
  | "required"
  | "tooLong"
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordsDoNotMatch";

// One message key per field (the first problem), for the form to show next to it.
export function fieldErrors(error: z.ZodError | undefined): Record<string, ValidationKey> {
  const errors: Record<string, ValidationKey> = {};
  for (const issue of error?.issues ?? []) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message as ValidationKey;
  }
  return errors;
}
