// The origin the browser used: hoemapp.com, a Vercel preview URL or a local server. Links in
// e-mails point back to it; Supabase Auth still checks them against its redirect allow-list, so a
// forged Host header cannot send a verification link elsewhere.
export function requestOrigin(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const protocol = headers.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${protocol}://${host}`;
}
