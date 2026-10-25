// Spanish follows in phase 2 (ADR-012): add "es" here and messages/es.json.
export const supportedLocales = ["en"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "en";

// Holds profiles.locale for the browser: written on sign-in and when the user changes the
// language (#13, #22), so the proxy can honour the profile without a database call.
export const localeCookie = "hoem-locale";
