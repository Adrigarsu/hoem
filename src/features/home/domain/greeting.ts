export type PartOfDay = "morning" | "afternoon" | "evening";

// The part of the day in the user's time zone, for "Good morning, Lucía" (FR-DASH-001): morning
// from 05:00, afternoon from 12:00, evening from 18:00 and through the night.
export function partOfDay(now: Date, timeZone: string): PartOfDay {
  const hour = Number(
    new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone }).format(now),
  );
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}
