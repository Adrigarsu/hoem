import { NextResponse, type NextRequest } from "next/server";
import { authPagePaths, isPublicPath } from "@/features/auth";
import { localeCookie, supportedLocales } from "@/lib/i18n/locales";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { refreshSession } from "@/lib/supabase/proxy-session";

const localePrefix = new RegExp(`^/(${supportedLocales.join("|")})(?=/|$)`);

export async function proxy(request: NextRequest) {
  const session = await refreshSession(request);
  return session.applyTo(routeRequest(request, session));
}

// Where a page request goes, given whether the visitor is signed in.
export function routeRequest(request: NextRequest, { signedIn }: { signedIn: boolean }) {
  const url = request.nextUrl.clone();
  const { pathname, search } = request.nextUrl;

  // /en/shopping would be a second address for /shopping (ADR-015).
  if (localePrefix.test(pathname)) {
    url.pathname = pathname.replace(localePrefix, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  // FR-ACC-001: the app needs a session; sign-in brings the visitor back to the page they asked for.
  if (!signedIn && !isPublicPath(pathname)) {
    url.pathname = "/sign-in";
    url.search =
      pathname === "/" && !search ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && authPagePaths.includes(pathname)) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ADR-015: the locale is not in the URL. Rewriting internally to the [locale] segment keeps a
  // static shell per locale (Cache Components). The request headers carry any refreshed cookies.
  const locale = resolveLocale({
    profileLocale: request.cookies.get(localeCookie)?.value ?? null,
    acceptLanguage: request.headers.get("accept-language"),
  });
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers: request.headers } });
}

export const config = {
  // Not for the REST API, Next.js internals or static files (by extension, so a page URL with a
  // dot, such as /notes/v1.2, is still localised). Next.js reads this literal at build time.
  matcher: [
    "/((?!(?:api|_next|_vercel)(?:/|$)|.*\\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|ttf|txt|webmanifest|webp|woff2?|xml)$).*)",
  ],
};
