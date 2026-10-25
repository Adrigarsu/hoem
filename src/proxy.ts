import { NextResponse, type NextRequest } from "next/server";
import { localeCookie, supportedLocales } from "@/lib/i18n/locales";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

const localePrefix = new RegExp(`^/(${supportedLocales.join("|")})(?=/|$)`);

// ADR-012: the locale is not in the URL. The proxy picks it and rewrites internally to the
// [locale] segment, so each locale still gets a static shell (Cache Components).
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // /en/shopping would be a second address for /shopping.
  if (localePrefix.test(url.pathname)) {
    url.pathname = url.pathname.replace(localePrefix, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  const locale = resolveLocale({
    profileLocale: request.cookies.get(localeCookie)?.value ?? null,
    acceptLanguage: request.headers.get("accept-language"),
  });
  url.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Not for the REST API, Next.js internals or static files (by extension, so a page URL with a
  // dot, such as /notes/v1.2, is still localised). Next.js reads this literal at build time.
  matcher: [
    "/((?!(?:api|_next|_vercel)(?:/|$)|.*\\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|ttf|txt|webmanifest|webp|woff2?|xml)$).*)",
  ],
};
