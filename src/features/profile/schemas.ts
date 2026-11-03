import { z } from "zod";
import { themes } from "@/lib/theme/theme";
import { formFieldErrors } from "@/lib/validation";

// Messages are keys under Profile.validation (docs/architecture.md §4.2).
export type ValidationKey = "required" | "tooLong";

export function fieldErrors(error: z.ZodError | undefined): Record<string, ValidationKey> {
  return formFieldErrors<ValidationKey>(error);
}

// The same limit as the profiles_display_name_length check.
export const nameSchema = z.object({
  name: z.string().trim().min(1, { error: "required" }).max(50, { error: "tooLong" }),
});

export const themeSchema = z.object({ theme: z.enum(themes) });

export type NameInput = z.infer<typeof nameSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
