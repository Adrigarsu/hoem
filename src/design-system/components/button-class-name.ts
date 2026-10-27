// Shared by Button and by links that look like one; plain module, so Server Components can call it.
const variants = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "border-border-control bg-surface text-text hover:bg-surface-subtle",
  ghost: "bg-transparent text-text hover:bg-surface-subtle",
  danger: "bg-danger text-on-accent",
};

export type ButtonVariant = keyof typeof variants;

// For a link that looks like a button, such as "Ask for a new link".
export function buttonClassName(variant: ButtonVariant = "primary") {
  return `inline-flex h-control-height items-center justify-center gap-2 rounded-md border border-transparent px-5 text-label transition-colors duration-fast aria-disabled:cursor-progress ${variants[variant]}`;
}
