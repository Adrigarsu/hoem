"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { buttonClassName, type ButtonVariant } from "./button-class-name";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
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
      className={`${buttonClassName(variant)} ${className}`}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
