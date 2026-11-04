import "server-only";
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
    updateEmail: (email, options) => auth.updateUser({ email }, options),
    // getUser asks Supabase Auth, unlike getClaims, which reads the token: an e-mail confirmed in
    // another browser shows without signing in again (FR-ACC-007). Auth gives no sign of a
    // password, so a database function reads it (own_account_has_password, #98).
    async account() {
      const { data, error } = await auth.getUser();
      if (error || !data.user) return null;
      const { data: hasPassword, error: rpcError } = await supabase.rpc("own_account_has_password");
      if (rpcError) throw rpcError;
      return {
        email: data.user.email ?? "",
        pendingEmail: data.user.new_email ?? null,
        hasPassword: hasPassword === true,
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
