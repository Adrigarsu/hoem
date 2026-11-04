import "server-only";
import { isAuthApiError, isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toTheme } from "@/lib/theme/theme";
import type { AuthGateway } from "./service";

// Supabase Auth and the profile lookup behind the AuthGateway the service expects.
export async function authGateway(): Promise<AuthGateway> {
  const supabase = await createClient();
  const { auth } = supabase;

  return {
    signUp: (params) => auth.signUp(params),
    signInWithPassword: (params) => auth.signInWithPassword(params),
    resend: (params) => auth.resend(params),
    verifyOtp: (params) => auth.verifyOtp(params),
    signOut: () => auth.signOut(),
    resetPasswordForEmail: (email, options) => auth.resetPasswordForEmail(email, options),
    updatePassword: (password) => auth.updateUser({ password }),
    signOutOthers: () => auth.signOut({ scope: "others" }),
    signOutHere: () => auth.signOut({ scope: "local" }),
    updateEmail: (email, options) => auth.updateUser({ email }, options),
    // getUser asks Supabase Auth, unlike getClaims, which reads the token: an e-mail confirmed in
    // another browser shows without signing in again (FR-ACC-007). Auth gives no sign of a
    // password, so a database function reads it (own_account_has_password, #98).
    async account() {
      // Independent requests with the same token, so they go together.
      const [{ data, error }, password] = await Promise.all([
        auth.getUser(),
        supabase.rpc("own_account_has_password"),
      ]);
      if (error) {
        // No session, or one Supabase no longer knows (signed out elsewhere, deleted account), is
        // "signed out"; anything else, such as Auth being unreachable, is a failure to report.
        if (isAuthSessionMissingError(error) || (isAuthApiError(error) && error.status < 500)) {
          return null;
        }
        throw error;
      }
      // The function refuses a caller without an account, which getUser has just ruled out.
      if (password.error) throw password.error;
      return {
        email: data.user.email ?? "",
        pendingEmail: data.user.new_email ?? null,
        hasPassword: password.data === true,
      };
    },
    // Names the user's own row although row-level security limits it today: #26 lets members read
    // each other's profiles, and several rows would make this query fail.
    async profilePreferences() {
      const { data: session } = await auth.getClaims();
      if (!session) return { locale: null, theme: null };
      const { data } = await supabase
        .from("profiles")
        .select("locale, theme")
        .eq("id", session.claims.sub)
        .maybeSingle();
      return { locale: data?.locale ?? null, theme: data ? toTheme(data.theme) : null };
    },
  };
}
