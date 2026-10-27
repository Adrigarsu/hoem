// The initials of a name, such as "LG" for Lucía García: the first letter of the first and the last
// word. Photos come with the profile (#22).
function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words.at(-1) ?? "") : "";
  return [first, last]
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

// Decorative: the button or link around it carries the person's name.
export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-brand-tint text-label text-brand-ink"
    >
      {initials(name)}
    </span>
  );
}
