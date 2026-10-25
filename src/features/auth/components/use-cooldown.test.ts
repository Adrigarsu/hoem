import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCooldown } from "./use-cooldown";

describe("useCooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("FR-ACC-001 is ready before anything was sent", () => {
    const { result } = renderHook(() => useCooldown(60));
    expect(result.current.secondsLeft).toBe(0);
  });

  it("FR-ACC-001 counts down the seconds after a new link was sent", () => {
    const { result } = renderHook(() => useCooldown(60));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(58);
  });

  it("FR-ACC-001 lets the user ask again once the wait is over", () => {
    const { result } = renderHook(() => useCooldown(60));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.secondsLeft).toBe(0);
  });
});
