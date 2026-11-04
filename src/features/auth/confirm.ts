import "server-only";
import { settingsPaths } from "@/features/settings";
import { AuthFailedError } from "@/lib/errors";
import { failedLinkTarget, linkTarget, verificationType } from "./domain/verification-link";
import { rememberPreferences } from "./locale-cookie";
import { authGateway } from "./repository";
import { verifyEmail } from "./service";

// Handles the link from the verification and e-mail change e-mails and returns where to send the
// browser: the app (signed in) on success, or sign-in with a reason when the link is expired,
// reused or broken.
export async function verifyEmailLink(params: URLSearchParams): Promise<string> {
  const tokenHash = params.get("token_hash");
  const type = verificationType(params.get("type"));
  if (!tokenHash || !type) return "/sign-in?error=linkExpired";

  try {
    await rememberPreferences(await verifyEmail(await authGateway(), tokenHash, type));
  } catch (error) {
    if (!(error instanceof AuthFailedError)) throw error;
    const reason = error.reason === "linkExpired" ? "linkExpired" : "generic";
    return failedLinkTarget(type, reason, settingsPaths.account);
  }
  return linkTarget(type, params.get("next"), settingsPaths.account);
}
