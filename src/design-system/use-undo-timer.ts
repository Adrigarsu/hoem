"use client";

import { useEffect, useRef, type RefObject } from "react";

// ADR-009 and NFR-UX-002: the interface hides an item at once, and only commits the delete when
// nobody undid it in this time.
export const undoDelayMs = 5000;

type Commit = () => void | Promise<void>;

// Sent instead of the commit when the page unloads (pagehide): it must be synchronous and survive
// the unload, such as fetch with keepalive. A Server Action is cancelled with the page (ADR-020).
type Options = { onUnload?: () => void };

type Waiting = {
  commit: Commit;
  onUnload?: () => void;
  timer?: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
};

// Every mounted timer's way to commit at once, for commitWaitingUndos.
const flushers = new Set<() => Promise<void>>();

// Commits every action still waiting and resolves once they are done. Signing out calls it first:
// a delete sent after the session ends is refused, and the item the user deleted would stay.
export async function commitWaitingUndos() {
  await Promise.all([...flushers].map((flush) => flush()));
}

// Empties the ref and stops its timer, returning what was waiting.
function take(waiting: RefObject<Waiting | null>) {
  const current = waiting.current;
  if (current?.timer) clearTimeout(current.timer);
  waiting.current = null;
  return current;
}

// Commits and remembers the action until its commit settles, so an unload in the meantime can
// still send it with keepalive: the commit's own request is cancelled with the page.
async function commitTracked(current: Waiting | null, running: RefObject<Set<Waiting>>) {
  if (!current) return;
  running.current.add(current);
  try {
    await current.commit();
  } finally {
    running.current.delete(current);
  }
}

// One action waiting to be committed, such as a delete. It commits after 5 seconds, or at once when
// the page is closed (pagehide) or the component unmounts, so leaving never keeps a deleted item. It
// can be paused while someone reads or reaches the Undo button (WCAG 2.2.1, Timing Adjustable).
export function useUndoTimer() {
  const waiting = useRef<Waiting | null>(null);
  const running = useRef(new Set<Waiting>());

  async function flush() {
    await commitTracked(take(waiting), running);
  }

  function schedule(current: Waiting) {
    current.startedAt = Date.now();
    current.timer = setTimeout(() => void flush(), current.remaining);
  }

  function start(commit: Commit, { onUnload }: Options = {}) {
    void flush();
    const current: Waiting = { commit, onUnload, remaining: undoDelayMs, startedAt: 0 };
    waiting.current = current;
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
    take(waiting);
  }

  // Reads the refs, not state, so the latest action is the one committed.
  useEffect(() => {
    const commitNow = () => commitTracked(take(waiting), running);
    const onPageHide = () => {
      const current = take(waiting);
      if (current && !current.onUnload) void commitTracked(current, running);
      const unloads = [...running.current, ...(current ? [current] : [])];
      running.current.clear();
      for (const action of unloads) action.onUnload?.();
    };
    flushers.add(commitNow);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      flushers.delete(commitNow);
      window.removeEventListener("pagehide", onPageHide);
      void commitNow();
    };
  }, []);

  return { start, undo, pause, resume };
}
