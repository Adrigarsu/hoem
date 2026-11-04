import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commitWaitingUndos, undoDelayMs, useUndoTimer } from "./use-undo-timer";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function started() {
  const commit = vi.fn();
  const hook = renderHook(() => useUndoTimer());
  act(() => hook.result.current.start(commit));
  return { commit, hook };
}

describe("useUndoTimer", () => {
  it("NFR-UX-002 waits 5 seconds before committing", () => {
    const { commit } = started();
    act(() => vi.advanceTimersByTime(undoDelayMs - 1));
    expect(commit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("NFR-UX-002 never commits after undo", () => {
    const { commit, hook } = started();
    act(() => hook.result.current.undo());
    act(() => vi.advanceTimersByTime(undoDelayMs * 2));
    expect(commit).not.toHaveBeenCalled();
  });

  it("NFR-UX-002 commits every waiting action on request, and waits for them to finish", async () => {
    let finish = () => undefined as void;
    const commit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const hook = renderHook(() => useUndoTimer());
    act(() => hook.result.current.start(commit));
    let done = false;
    const all = commitWaitingUndos().then(() => (done = true));
    expect(commit).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(done).toBe(false);
    finish();
    await all;
    expect(done).toBe(true);
    act(() => vi.advanceTimersByTime(undoDelayMs));
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("NFR-A11Y-001 stops the countdown while paused and resumes with the time left", () => {
    const { commit, hook } = started();
    act(() => vi.advanceTimersByTime(3000));
    act(() => hook.result.current.pause());
    act(() => vi.advanceTimersByTime(undoDelayMs * 2));
    expect(commit).not.toHaveBeenCalled();
    act(() => hook.result.current.resume());
    act(() => vi.advanceTimersByTime(1999));
    expect(commit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("NFR-UX-002 commits the previous action when a new one starts", () => {
    const { commit, hook } = started();
    const next = vi.fn();
    act(() => hook.result.current.start(next));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("NFR-UX-002 commits at once when the page is hidden for good", () => {
    const { commit } = started();
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(commit).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(undoDelayMs));
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("NFR-UX-002 sends the unload request on pagehide instead of the commit", () => {
    const commit = vi.fn();
    const onUnload = vi.fn();
    const hook = renderHook(() => useUndoTimer());
    act(() => hook.result.current.start(commit, { onUnload }));
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(onUnload).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(undoDelayMs));
    expect(commit).not.toHaveBeenCalled();
  });

  it("NFR-UX-002 also sends the unload request when the page unloads while the commit is running", async () => {
    let finish = () => undefined as void;
    const commit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onUnload = vi.fn();
    const hook = renderHook(() => useUndoTimer());
    act(() => hook.result.current.start(commit, { onUnload }));
    act(() => vi.advanceTimersByTime(undoDelayMs));
    expect(commit).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(onUnload).toHaveBeenCalledTimes(1);
    finish();
    await act(async () => undefined);
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(onUnload).toHaveBeenCalledTimes(1);
  });

  it("NFR-UX-002 still commits on unmount when it has an unload request, as the page stays", () => {
    const commit = vi.fn();
    const onUnload = vi.fn();
    const hook = renderHook(() => useUndoTimer());
    act(() => hook.result.current.start(commit, { onUnload }));
    hook.unmount();
    expect(commit).toHaveBeenCalledTimes(1);
    expect(onUnload).not.toHaveBeenCalled();
  });

  it("NFR-UX-002 commits on unmount", () => {
    const { commit, hook } = started();
    hook.unmount();
    expect(commit).toHaveBeenCalledTimes(1);
  });
});
