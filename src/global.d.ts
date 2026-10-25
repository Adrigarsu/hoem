import type messages from "../messages/en.json";
import type { Locale } from "./lib/i18n/locales";

// Typed messages: a key missing from en.json is a type error, not blank text on screen.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
