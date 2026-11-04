"use client";

import { useEffect, useRef, useState } from "react";

// ADR-009 and NFR-UX-002: the interface hides an item at once, and only commits the delete when
// nobody undid it in this time.
export const undoDelayMs = 5000;

type Waiting = {
  commit: () => void;
  timer?: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
};

// One action waiting to be committed, such as a delete. It commits after 5 seconds, or at once when
// the page is closed (pagehide) or the component unmounts, so leaving never keeps a deleted item. It
// can be paused while someone reads or reaches the Undo button (WCAG 2.2.1, Timing Adjustable).
export function useUndoTimer() {
  const waiting = useRef<Waiting | null>(null);
  const [pending, setPending] = useState(false);

  function clear() {
    const current = waiting.current;
    if (current?.timer) clearTimeout(current.timer);
    waiting.current = null;
    setPending(false);
    return current;
  }

  function flush() {
    clear()?.commit();
  }

  function schedule(current: Waiting) {
    current.startedAt = Date.now();
    current.timer = setTimeout(flush, current.remaining);
  }

  function start(commit: () => void) {
    flush();
    const current: Waiting = { commit, remaining: undoDelayMs, startedAt: 0 };
    waiting.current = current;
    setPending(true);
    schedule(current);
  }

  function pause() {
    const current = waiting.current;
    if (!current?.timer) return;
    clearTimeout(current.timer);
    current.timer = undefined;
    current.remaining -= Date.now() - current.startedAt;
  }

  function resume() {
    const current = waiting.current;
    if (!current || current.timer) return;
    schedule(current);
  }

  function undo() {
    clear();
  }

  // Reads the ref, not state, so the latest action is the one committed.
  useEffect(() => {
    const commitWaiting = () => {
      const current = waiting.current;
      if (current?.timer) clearTimeout(current.timer);
      waiting.current = null;
      current?.commit();
    };
    window.addEventListener("pagehide", commitWaiting);
    return () => {
      window.removeEventListener("pagehide", commitWaiting);
      commitWaiting();
    };
  }, []);

  return { pending, start, undo, pause, resume };
}
