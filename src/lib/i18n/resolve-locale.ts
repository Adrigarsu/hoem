import { defaultLocale, supportedLocales } from "./locales";

type LocaleSources = { profileLocale: string | null; acceptLanguage: string | null };

// ADR-012: the profile wins, then the browser's Accept-Language, then English.
export function resolveLocale(
  { profileLocale, acceptLanguage }: LocaleSources,
  supported: readonly string[] = supportedLocales,
): string {
  if (profileLocale !== null && supported.includes(profileLocale)) return profileLocale;
  const preferred = preferredLanguages(acceptLanguage ?? "");
  return preferred.find((language) => supported.includes(language)) ?? defaultLocale;
}

// "fr-FR,en;q=0.8" → ["fr", "en"], highest q first, regions dropped. RFC 9110 §12.4.2: an
// entry without q has quality 1; one with an empty or invalid q is skipped.
function preferredLanguages(header: string): string[] {
  return header
    .split(",")
    .map((entry) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return {
        language: tag.split("-")[0]?.toLowerCase() ?? "",
        quality: q === undefined ? 1 : parseQuality(q.slice(2)),
      };
    })
    .filter(({ language, quality }) => /^[a-z]{2,3}$/.test(language) && quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map(({ language }) => language);
}

function parseQuality(value: string): number {
  return /^(0(\.\d{0,3})?|1(\.0{0,3})?)$/.test(value) ? Number(value) : 0;
}
