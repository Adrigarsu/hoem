// Pages a signed-out visitor may open. Everything else needs a session (FR-ACC-001).
const publicPaths = ["/sign-in", "/sign-up"];
const publicPrefixes = ["/auth/"];

// Pages that make no sense once signed in, so a "return to" link never points at them.
export const authPagePaths = ["/sign-in", "/sign-up"];

export function isPublicPath(pathname: string): boolean {
  return (
    publicPaths.includes(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}
