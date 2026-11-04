"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const SlotContext = createContext<HTMLElement | null>(null);
const SetSlotContext = createContext<(element: HTMLElement | null) => void>(() => undefined);

// Where toasts appear: the shell sticks the slot to the bottom with the tab bar, while the page that
// shows a toast, such as a list with an undo, renders it from wherever it is.
export function ToastSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <SetSlotContext value={setSlot}>
      <SlotContext value={slot}>{children}</SlotContext>
    </SetSlotContext>
  );
}

export function ToastSlot() {
  const setSlot = use(SetSlotContext);
  return <div ref={setSlot} />;
}

// Renders a Toast into the slot. Mounted with its page, so the toast's live regions exist before
// its first message, which a screen reader then announces. Without a slot nothing is shown.
export function ToastPortal({ children }: { children: ReactNode }) {
  const slot = use(SlotContext);
  return slot ? createPortal(children, slot) : null;
}
