"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  // Escape, the cancel action or the parent closing it. Focus then returns to whatever opened it,
  // which the browser does for a modal <dialog>.
  onClose: () => void;
  title: string;
  // alertdialog for a message the user must answer before going on, such as a refusal.
  role?: "dialog" | "alertdialog";
  // Read with the title when the dialog opens.
  description: ReactNode;
  // Anything else, such as fields; not part of the description.
  children?: ReactNode;
  actions: ReactNode;
  // False holds back Escape while something irreversible is under way.
  dismissible?: boolean;
};

// A modal on the native <dialog>: showModal traps focus, makes the page behind inert, closes on
// Escape and draws the scrim through ::backdrop. Titled by its heading and described by its description.
export function Dialog({
  open,
  onClose,
  title,
  role = "dialog",
  description,
  children,
  actions,
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    // Next.js keeps the previous route in a hidden <Activity>, which only runs this cleanup: a modal
    // left open would stay in the top layer, invisible, and make the next page inert.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={onClose}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      className="m-auto w-full max-w-dialog-width bg-transparent p-4 backdrop:bg-scrim"
    >
      {/* The transparent padding keeps the panel off the screen edges on phones. */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 text-text">
        <h2 id={titleId} className="text-subtitle text-text">
          {title}
        </h2>
        <div id={bodyId} className="flex flex-col gap-3 text-body text-text-secondary">
          {description}
        </div>
        {children}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>
      </div>
    </dialog>
  );
}
