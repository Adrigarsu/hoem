"use server";

import { revalidatePath } from "next/cache";
import { ValidationError } from "@/lib/errors";
import { appLayout } from "./app-layout";
import type { AvatarRejection } from "./domain/avatar-rules";
import { profileGateway } from "./repository";
import { fieldErrors, nameSchema, themeSchema, type ValidationKey } from "./schemas";
import { removeOwnPhoto } from "./remove-own-photo";
import { changeAvatar, updateName, updateTheme } from "./service";

export type NameFormState = {
  status: "idle" | "invalid" | "saved" | "failed";
  fieldErrors?: Record<string, ValidationKey>;
  values?: { name: string };
};

export async function saveNameAction(_: NameFormState, formData: FormData): Promise<NameFormState> {
  const name = formData.get("name");
  const values = { name: typeof name === "string" ? name : "" };
  const parsed = nameSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: fieldErrors(parsed.error), values };
  }
  try {
    await updateName(await profileGateway(), parsed.data);
  } catch (error) {
    console.error("Could not save the name", error);
    return { status: "failed", values };
  }
  revalidatePath(appLayout, "layout");
  return { status: "saved", values: parsed.data };
}

export async function saveThemeAction(theme: string): Promise<{ saved: boolean }> {
  const parsed = themeSchema.safeParse({ theme });
  if (!parsed.success) return { saved: false };
  try {
    await updateTheme(await profileGateway(), parsed.data);
  } catch (error) {
    console.error("Could not save the theme", error);
    // The form puts the previous theme back and says so.
    return { saved: false };
  }
  revalidatePath(appLayout, "layout");
  return { saved: true };
}

export type PhotoFailure = AvatarRejection | "failed";

export type PhotoFormState =
  { status: "idle" | "saved" } | { status: "failed"; reason: PhotoFailure };

function failureOf(error: unknown): PhotoFailure {
  if (!(error instanceof ValidationError)) {
    console.error("Could not change the photo", error);
    return "failed";
  }
  return error.fieldErrors[0]?.code === "tooLarge" ? "tooLarge" : "wrongType";
}

export async function changePhotoAction(
  _: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  const photo = formData.get("photo");
  if (!(photo instanceof File)) return { status: "failed", reason: "wrongType" };
  try {
    // Loaded here so the native module costs nothing to, and cannot break, the other actions.
    const { encodeAvatar } = await import("./avatar-image");
    const image = new Uint8Array(await photo.arrayBuffer());
    await changeAvatar(await profileGateway(), encodeAvatar, image);
  } catch (error) {
    return { status: "failed", reason: failureOf(error) };
  }
  revalidatePath(appLayout, "layout");
  return { status: "saved" };
}

// Sent once the 5-second undo has passed, or on pagehide (ADR-009). It takes no input: whose photo
// goes comes from the session.
export async function removePhotoAction(): Promise<{ removed: boolean }> {
  try {
    await removeOwnPhoto();
  } catch (error) {
    console.error("Could not remove the photo", error);
    // The interface puts the photo back and says so.
    return { removed: false };
  }
  return { removed: true };
}
