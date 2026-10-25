"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthFailedError } from "@/lib/errors";
import { requestOrigin } from "@/lib/request-origin";
import type { AuthErrorKey } from "./domain/auth-errors";
import { safeNextPath } from "./domain/next-path";
import { rememberLocale } from "./locale-cookie";
import { pendingSignUp, rememberPendingSignUp } from "./pending-sign-up-cookie";
import { authGateway } from "./repository";
import {
  fieldErrors,
  resendSchema,
  signInSchema,
  signUpSchema,
  type ValidationKey,
} from "./schemas";
import * as auth from "./service";

// Thin entry points: parse with the shared schema, call the service, map the result to form
// state. Passwords are never echoed back to the form.
export type AuthFormState = {
  status: "idle" | "invalid" | "failed" | "resent";
  fieldErrors?: Record<string, ValidationKey>;
  error?: AuthErrorKey;
  values?: { displayName?: string; email?: string };
};

const confirmPath = "/auth/confirm";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function failure(error: unknown, values: AuthFormState["values"]): AuthFormState {
  if (error instanceof AuthFailedError) {
    return { status: "failed", error: error.reason as AuthErrorKey, values };
  }
  throw error;
}

async function confirmUrl() {
  return `${requestOrigin(await headers())}${confirmPath}`;
}

export async function signUpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { displayName: text(formData, "displayName"), email: text(formData, "email") };
  const parsed = signUpSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }

  try {
    await auth.signUp(await authGateway(), parsed.data, {
      locale: await getLocale(),
      // From the browser (Intl); the database falls back to UTC for anything it does not know.
      timeZone: text(formData, "timeZone").slice(0, 64),
      confirmUrl: await confirmUrl(),
    });
  } catch (error) {
    return failure(error, values);
  }
  await rememberPendingSignUp({ email: parsed.data.email, displayName: parsed.data.displayName });
  redirect("/check-your-inbox");
}

export async function signInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }

  try {
    const { locale } = await auth.signIn(await authGateway(), parsed.data);
    await rememberLocale(locale);
  } catch (error) {
    return failure(error, { email: parsed.data.email });
  }
  redirect(safeNextPath(text(formData, "next")));
}

// "Resend the link" on sign-in, for an account that is not verified yet: sends a new link and
// opens Check your inbox for that address.
export async function resendFromSignInAction(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resendSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return { status: "failed", error: "generic" };

  try {
    await auth.resendVerification(await authGateway(), parsed.data.email, await confirmUrl());
  } catch (error) {
    return failure(error, { email: parsed.data.email });
  }
  await rememberPendingSignUp({ email: parsed.data.email, displayName: "" });
  redirect("/check-your-inbox");
}

// "Resend email" on Check your inbox. The address comes from the cookie, not from the form, so
// the page never has to put it in its markup as an input.
export async function resendFromInboxAction(): Promise<AuthFormState> {
  const pending = await pendingSignUp();
  if (!pending) return { status: "failed", error: "generic" };

  try {
    await auth.resendVerification(await authGateway(), pending.email, await confirmUrl());
  } catch (error) {
    return failure(error, undefined);
  }
  return { status: "resent" };
}

export async function signOutAction() {
  await auth.signOut(await authGateway());
  redirect("/sign-in");
}
