// The initials of a name, such as "LG" for Lucía García: the first letter of the first and the last
// word.
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

type AvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  // A short-lived signed URL of the photo; without one, the initials.
  src?: string | null;
};

// Decorative: the button or link around it carries the person's name. The photo lies over the
// initials, so they show through when it fails to load (a browser draws nothing for alt="").
export function Avatar({ name, size = "md", src }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-tint text-brand-ink ${sizes[size]}`}
    >
      {initials(name)}
      {src && (
        // Not next/image: its optimizer would keep a private photo in a shared cache, beyond the
        // life of the signed URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}
