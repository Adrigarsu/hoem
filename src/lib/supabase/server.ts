import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { env } from "@/lib/env";
import { requestOrigin } from "@/lib/request-origin";
import { authCookieOptions } from "./cookie-options";

// For Server Components, Server Actions and route handlers. Every query runs with the user's own
// JWT, so row-level security applies (ADR-004).
export async function createClient() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: authCookieOptions(requestOrigin(headerStore)),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // The no-cache headers @supabase/ssr passes as a second argument are applied by
        // src/proxy.ts, which refreshes the session on every page request. Server Actions and
        // route handlers render no cacheable page.
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies; the proxy has already refreshed the session.
          }
        },
      },
    },
  );
}

// For REST requests that send `Authorization: Bearer` (docs/architecture.md §5.2). Every query
// carries that token, so it runs as its user under RLS, as with cookies (ADR-004). Nothing is
// stored or refreshed: the token is the caller's.
export function createTokenClient(accessToken: string) {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}
