import { getLocale, getTranslations } from "next-intl/server";
import { ownProfile } from "@/features/profile";
import { formatToday } from "@/lib/i18n/format";
import { partOfDay } from "../domain/greeting";

// "Good morning, Lucía" and today's date, both in the user's own time zone (FR-DASH-001).
export async function Greeting() {
  const [profile, locale, t] = await Promise.all([
    ownProfile(),
    getLocale(),
    getTranslations("Home.greeting"),
  ]);
  const now = new Date();

  return (
    <>
      <h1 className="text-title font-bold md:text-heading">
        {t(partOfDay(now, profile.timeZone), { name: profile.displayName })}
      </h1>
      <p className="text-body text-text-secondary">{formatToday(now, locale, profile.timeZone)}</p>
    </>
  );
}

// Holds the place of the greeting while the profile loads, in the same layout (home.md, Loading).
export function GreetingSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <span className="block h-8 w-3/4 rounded-sm bg-surface-subtle md:h-10" />
      <span className="block h-6 w-1/2 rounded-sm bg-surface-subtle" />
    </div>
  );
}
