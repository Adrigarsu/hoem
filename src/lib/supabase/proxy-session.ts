import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { requestOrigin } from "@/lib/request-origin";
import { authCookieOptions } from "./cookie-options";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<NextResponse["cookies"]["set"]>[2];
};

// Refreshes the Supabase session on every page request, so Server Components always see a valid
// token. Refreshed cookies are written to the request (for the page rendering now) and, through
// applyTo, to whatever response the proxy returns, together with the no-cache headers
// @supabase/ssr asks for, so a CDN never stores a response that sets auth cookies.
export async function refreshSession(request: NextRequest) {
  let cookiesToSet: CookieToSet[] = [];
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: authCookieOptions(requestOrigin(request.headers)),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies, headers) {
          for (const { name, value } of cookies) request.cookies.set(name, value);
          cookiesToSet = cookies;
          cacheHeaders = headers;
        },
      },
    },
  );

  // getClaims verifies the JWT signature; getSession alone would trust whatever the cookie says.
  const { data } = await supabase.auth.getClaims();

  return {
    signedIn: Boolean(data?.claims),
    applyTo(response: NextResponse): NextResponse {
      for (const { name, value, options } of cookiesToSet)
        response.cookies.set(name, value, options);
      for (const [key, value] of Object.entries(cacheHeaders)) response.headers.set(key, value);
      return response;
    },
  };
}
