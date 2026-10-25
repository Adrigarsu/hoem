import "server-only";
import { AuthFailedError } from "@/lib/errors";
import { safeNextPath } from "./domain/next-path";
import { rememberLocale } from "./locale-cookie";
import { authGateway } from "./repository";
import { verifyEmail, type VerificationType } from "./service";

const verificationTypes: readonly VerificationType[] = ["email", "signup"];

// Handles the link from the verification e-mail and returns where to send the browser: the app
// (signed in) on success, or sign-in with a reason when the link is expired, reused or broken.
export async function verifyEmailLink(params: URLSearchParams): Promise<string> {
  const tokenHash = params.get("token_hash");
  const type = verificationTypes.find((value) => value === params.get("type"));
  if (!tokenHash || !type) return "/sign-in?error=linkExpired";

  try {
    const { locale } = await verifyEmail(await authGateway(), tokenHash, type);
    await rememberLocale(locale);
  } catch (error) {
    if (!(error instanceof AuthFailedError)) throw error;
    return `/sign-in?error=${error.reason === "linkExpired" ? "linkExpired" : "generic"}`;
  }
  return safeNextPath(params.get("next"));
}
