import { authPagePaths } from "./public-paths";

const home = "/";

// The ?next= parameter comes from the URL, so anyone can craft it. Only a path inside this app is
// followed; anything else (another site, a protocol, a protocol-relative URL) goes Home, so a
// sign-in link can never forward the user to a phishing page (open redirect).
export function safeNextPath(value: string | null): string {
  if (!value?.startsWith("/")) return home;
  const url = new URL(value, "https://hoem.invalid");
  if (url.origin !== "https://hoem.invalid") return home;
  if (decodeURIComponent(url.pathname).includes("\\")) return home;
  if (authPagePaths.includes(url.pathname)) return home;
  return `${url.pathname}${url.search}`;
}
