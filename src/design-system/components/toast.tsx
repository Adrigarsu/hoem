"use client";

import { useEffect, useRef, type FocusEvent } from "react";
import { messageTones } from "./message-tones";

type ToastProps = {
  message: string | null;
  // A confirmation, or an error, which interrupts the screen reader (message-tones.ts).
  tone?: "success" | "danger";
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
export function Toast({ message, tone = "success", action, onPause, onResume }: ToastProps) {
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
      <div role="status">{messageTones[tone].role === "status" && content}</div>
      <div role="alert">{messageTones[tone].role === "alert" && content}</div>
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
  const Icon = messageTones[tone ?? "success"].icon;
  // Paused while either holds, so leaving with one does not restart the countdown under the other.
  const holds = useRef({ pointer: false, focus: false });
  // Where focus was when the toast appeared, such as the control that deleted the item. The action
  // removes the toast with its button, so focus goes back there instead of falling to the page.
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
  }, []);

  function hold(kind: "pointer" | "focus", on: boolean) {
    const wasHeld = holds.current.pointer || holds.current.focus;
    holds.current[kind] = on;
    const isHeld = holds.current.pointer || holds.current.focus;
    if (isHeld && !wasHeld) onPause?.();
    if (!isHeld && wasHeld) onResume?.();
  }

  function leaveFocus(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) hold("focus", false);
  }

  function act() {
    action?.onClick();
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
  }

  return (
    // Not an interaction of its own: hovering or focusing only pauses the countdown, and the
    // keyboard gets the same through the focus handlers.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      onMouseEnter={() => hold("pointer", true)}
      onMouseLeave={() => hold("pointer", false)}
      onFocus={() => hold("focus", true)}
      onBlur={leaveFocus}
      className="mx-4 mb-4 flex max-w-column-narrow items-center gap-3 rounded-md bg-text py-2 pr-2 pl-4 text-label text-bg"
    >
      <Icon
        aria-hidden="true"
        className={`size-icon-md shrink-0 ${tone === "danger" ? "" : "text-success-tint"}`}
        strokeWidth={1.5}
      />
      <p className="flex-1">{message}</p>
      {action && (
        <button
          type="button"
          onClick={act}
          className="h-control-height shrink-0 rounded-md px-4 text-label font-semibold text-brand-tint focus-visible:outline-bg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
