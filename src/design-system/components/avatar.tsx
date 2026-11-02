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

const sizes = {
  md: "size-10 text-label",
  // The account card of Profile and settings.
  lg: "size-avatar-lg text-subtitle",
};

// Decorative: the button or link around it carries the person's name.
export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
}
