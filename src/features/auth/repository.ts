import "server-only";
import { createClient } from "@/lib/supabase/server";
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
    // Row-level security returns only the signed-in user's own profile.
    async profileLocale() {
      const { data } = await supabase.from("profiles").select("locale").maybeSingle();
      return data?.locale ?? null;
    },
  };
}
