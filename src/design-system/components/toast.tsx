"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import type { FocusEvent } from "react";

type ToastProps = {
  message: string | null;
  // A confirmation waits for a pause in speech (status); an error interrupts (alert).
  tone?: "status" | "alert";
  // Such as "Undo" after a delete (ADR-009).
  action?: { label: string; onClick: () => void };
  // While the pointer or the focus is on the toast, so there is time to read it and reach the
  // action (WCAG 2.2.1).
  onPause?: () => void;
  onResume?: () => void;
};

// A short message at the bottom of the screen (`.h-toast` in components-reference.css). Both live
// regions stay in the page while empty: a screen reader only announces a change to a region it
// already knows.
export function Toast({ message, tone = "status", action, onPause, onResume }: ToastProps) {
  const content = message && (
    <ToastBody
      message={message}
      tone={tone}
      action={action}
      onPause={onPause}
      onResume={onResume}
    />
  );
  return (
    <div className="flex justify-center">
      <div role="status">{tone === "status" && content}</div>
      <div role="alert">{tone === "alert" && content}</div>
    </div>
  );
}

function ToastBody({
  message,
  tone,
  action,
  onPause,
  onResume,
}: Omit<ToastProps, "message"> & { message: string }) {
  const Icon = tone === "alert" ? CircleAlert : CircleCheck;

  function leaveFocus(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) onResume?.();
  }

  return (
    // Not an interaction of its own: hovering or focusing only pauses the countdown, and the
    // keyboard gets the same through the focus handlers.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={leaveFocus}
      className="mx-4 mb-4 flex max-w-column-narrow items-center gap-3 rounded-md bg-text py-2 pr-2 pl-4 text-label text-bg"
    >
      <Icon
        aria-hidden="true"
        className={`size-icon-md shrink-0 ${tone === "status" ? "text-success-tint" : ""}`}
        strokeWidth={1.5}
      />
      <p className="flex-1">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="h-control-height shrink-0 rounded-md px-4 text-label font-semibold text-brand-tint focus-visible:outline-bg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
