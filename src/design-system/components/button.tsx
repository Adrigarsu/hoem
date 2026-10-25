"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";

const variants = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "border-border-control bg-surface text-text hover:bg-surface-subtle",
  ghost: "bg-transparent text-text hover:bg-surface-subtle",
  danger: "bg-danger text-on-accent",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  // While a form is submitting: announced as busy and ignores clicks, but stays focusable, so
  // keyboard and screen reader users do not lose their place (a disabled button drops focus).
  pending?: boolean;
  // Shown instead of the label while pending, such as "Signing in…".
  pendingLabel?: string;
};

export function Button({
  variant = "primary",
  pending = false,
  pendingLabel,
  type = "button",
  className = "",
  onClick,
  children,
  ...props
}: ButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      type={type}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      onClick={handleClick}
      className={`inline-flex h-control-height items-center justify-center gap-2 rounded-md border border-transparent px-5 text-label transition-colors duration-fast aria-disabled:cursor-progress ${variants[variant]} ${className}`}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
