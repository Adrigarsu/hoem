// The theme of FR-ACC-007. `profiles.theme` is the source of truth; the cookie brings it to the
// browser before the first paint, because <html> is part of a static shell that cannot read the
// profile (ADR-018).
export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];

export const themeCookie = "hoem-theme";
export const themeCookieMaxAge = 60 * 60 * 24 * 365;

export function toTheme(value: unknown): Theme {
  return themes.find((theme) => theme === value) ?? "system";
}

// Runs in <head>, before anything is painted. Only "light" and "dark" reach data-theme; "system",
// no cookie or anything else leaves it to prefers-color-scheme (tokens.css).
export const themeScript = `(function(){var m=document.cookie.match(/(?:^|; )${themeCookie}=(light|dark)(?:;|$)/);if(m)document.documentElement.dataset.theme=m[1]})()`;

export function themeCookieAttributes(protocol: string): string {
  const attributes = `path=/; max-age=${themeCookieMaxAge}; samesite=lax`;
  return protocol === "https:" ? `${attributes}; secure` : attributes;
}

// In the browser: shows the theme now and remembers it for the next page load on this device.
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  document.cookie = `${themeCookie}=${theme}; ${themeCookieAttributes(location.protocol)}`;
}
