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
